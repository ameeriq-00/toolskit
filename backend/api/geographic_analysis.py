# backend/api/geographic_analysis.py
# الملف الكامل - 600+ سطر

import pandas as pd
import numpy as np
from datetime import datetime
from geopy.distance import geodesic
from .models import SiteInformation
from .utils import find_site_info


def analyze_movement_patterns_original(df):
    """Analyze movement patterns for original Excel analyzer"""
    try:
        print("\n=== Starting Original Format Movement Analysis ===")
        
        # Ensure we have required columns
        required_columns = ['SITE_ID', 'SITE_NAME', 'LAT', 'LON', 'CALL_INITIAL_TIME']
        if not all(col in df.columns for col in required_columns):
            print("Missing required columns for movement analysis")
            return get_empty_movement_result()

        # Convert datetime and sort
        df = df.copy()
        df['CALL_INITIAL_TIME'] = pd.to_datetime(df['CALL_INITIAL_TIME'], errors='coerce')
        df_sorted = df.sort_values('CALL_INITIAL_TIME').dropna(subset=['LAT', 'LON'])
        df_sorted['DateOnly'] = df_sorted['CALL_INITIAL_TIME'].dt.date
        df_sorted['Week'] = df_sorted['CALL_INITIAL_TIME'].dt.isocalendar().week
        df_sorted['Year'] = df_sorted['CALL_INITIAL_TIME'].dt.year
        df_sorted['WeekYear'] = df_sorted['Year'].astype(str) + '-W' + df_sorted['Week'].astype(str).str.zfill(2)

        daily_movements = {}
        weekly_movements = {}
        all_movements = []

        # Generate daily movements
        for date, day_data in df_sorted.groupby('DateOnly'):
            day_movements = []
            locations = []
            
            # Process each consecutive pair of records
            for i in range(len(day_data) - 1):
                current = day_data.iloc[i]
                next_record = day_data.iloc[i + 1]
                
                try:
                    distance = geodesic(
                        (float(current['LAT']), float(current['LON'])),
                        (float(next_record['LAT']), float(next_record['LON']))
                    ).kilometers

                    if distance > 0:  # Only include actual movements
                        movement = {
                            'from_site': {
                                'id': str(current['SITE_ID']),
                                'name': str(current['SITE_NAME']),
                                'lat': float(current['LAT']),
                                'lon': float(current['LON'])
                            },
                            'to_site': {
                                'id': str(next_record['SITE_ID']),
                                'name': str(next_record['SITE_NAME']),
                                'lat': float(next_record['LAT']),
                                'lon': float(next_record['LON'])
                            },
                            'distance': round(distance, 2),
                            'timestamp': current['CALL_INITIAL_TIME'].strftime('%Y-%m-%d %H:%M:%S')
                        }
                        day_movements.append(movement)
                        all_movements.append(movement)
                        
                        # Track unique locations
                        for site in [movement['from_site'], movement['to_site']]:
                            if site['id'] not in [loc['id'] for loc in locations]:
                                locations.append(site)

                except Exception as e:
                    print(f"Error calculating distance: {str(e)}")

            if day_movements:
                date_str = date.strftime('%Y-%m-%d')
                daily_movements[date_str] = {
                    'movements': day_movements,
                    'locations': locations,
                    'total_distance': round(sum(m['distance'] for m in day_movements), 2),
                    'total_movements': len(day_movements)
                }

        # Generate weekly movements
        for week, week_data in df_sorted.groupby('WeekYear'):
            week_movements = []
            locations = []
            
            for i in range(len(week_data) - 1):
                current = week_data.iloc[i]
                next_record = week_data.iloc[i + 1]
                
                try:
                    distance = geodesic(
                        (float(current['LAT']), float(current['LON'])),
                        (float(next_record['LAT']), float(next_record['LON']))
                    ).kilometers

                    if distance > 0:
                        movement = {
                            'from_site': {
                                'id': str(current['SITE_ID']),
                                'name': str(current['SITE_NAME']),
                                'lat': float(current['LAT']),
                                'lon': float(current['LON'])
                            },
                            'to_site': {
                                'id': str(next_record['SITE_ID']),
                                'name': str(next_record['SITE_NAME']),
                                'lat': float(next_record['LAT']),
                                'lon': float(next_record['LON'])
                            },
                            'distance': round(distance, 2),
                            'timestamp': current['CALL_INITIAL_TIME'].strftime('%Y-%m-%d %H:%M:%S')
                        }
                        week_movements.append(movement)
                        
                        # Track unique locations
                        for site in [movement['from_site'], movement['to_site']]:
                            if site['id'] not in [loc['id'] for loc in locations]:
                                locations.append(site)

                except Exception as e:
                    print(f"Error calculating distance: {str(e)}")

            if week_movements:
                weekly_movements[week] = {
                    'movements': week_movements,
                    'locations': locations,
                    'total_distance': round(sum(m['distance'] for m in week_movements), 2),
                    'total_movements': len(week_movements)
                }

        movement_stats = calculate_movement_stats(all_movements)
        
        result = {
            'daily_movements': {
                'days': sorted(list(daily_movements.keys())),
                'movements': daily_movements
            },
            'weekly_movements': {
                'weeks': sorted(list(weekly_movements.keys())),
                'movements': weekly_movements
            },
            'movement_stats': movement_stats
        }
        
        print(f"Generated {len(daily_movements)} daily periods and {len(weekly_movements)} weekly periods")
        return result

    except Exception as e:
        print(f"Error in analyze_movement_patterns_original: {str(e)}")
        import traceback
        traceback.print_exc()
        return get_empty_movement_result()


def analyze_movement_patterns_z(df, sheet_owner_number, site_info):
    """
    ✅ FIXED: Analyze movement patterns for Excel Analyzer Z
    محسّن مع logging أفضل ومعالجة أخطاء شاملة
    """
    try:
        print(f"\n=== Starting Z Format Movement Analysis ===")
        print(f"Sheet owner: {sheet_owner_number}")
        print(f"DataFrame shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        # ✅ FIXED: Better data type conversion
        df = df.copy()  # Work on a copy
        df['Calling Number'] = df['Calling Number'].astype(str).str.strip()
        df['Called Number'] = df['Called Number'].astype(str).str.strip()
        df['CALL_TYPE'] = df['CALL_TYPE'].astype(str).str.strip()
        
        # ✅ FIXED: Better date conversion
        if not pd.api.types.is_datetime64_any_dtype(df['Date']):
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        
        # Remove rows with invalid dates
        df = df.dropna(subset=['Date'])
        print(f"Rows after date validation: {len(df)}")
        
        sheet_owner_number = str(sheet_owner_number).strip()

        # ✅ FIXED: Better call filtering
        outgoing_calls = df[
            (df['Calling Number'] == sheet_owner_number) & 
            (df['CALL_TYPE'].str.contains('1', na=False))
        ]
        incoming_calls = df[
            (df['Called Number'] == sheet_owner_number) & 
            (df['CALL_TYPE'].str.contains('2', na=False))
        ]
        
        print(f"Outgoing calls: {len(outgoing_calls)}")
        print(f"Incoming calls: {len(incoming_calls)}")
        
        relevant_calls = pd.concat([outgoing_calls, incoming_calls])
        print(f"Total relevant calls: {len(relevant_calls)}")

        if relevant_calls.empty:
            print("❌ No relevant calls found for sheet owner")
            return get_empty_movement_result()

        # Sort by time
        relevant_calls = relevant_calls.sort_values('Date').reset_index(drop=True)
        relevant_calls['DateOnly'] = relevant_calls['Date'].dt.date
        relevant_calls['Week'] = relevant_calls['Date'].dt.isocalendar().week
        relevant_calls['Year'] = relevant_calls['Date'].dt.year
        relevant_calls['WeekYear'] = relevant_calls['Year'].astype(str) + '-W' + relevant_calls['Week'].astype(str).str.zfill(2)

        # ✅ FIXED: Clean Site IDs more carefully
        def clean_site_id(site_id):
            try:
                if pd.isna(site_id):
                    return ''
                site_id_str = str(site_id).strip()
                if '.' in site_id_str:
                    site_id_str = site_id_str.split('.')[0]
                return site_id_str
            except Exception as e:
                print(f"Error cleaning site ID {site_id}: {e}")
                return ''
        
        relevant_calls['Site ID'] = relevant_calls['Site ID'].apply(clean_site_id)
        relevant_calls = relevant_calls[relevant_calls['Site ID'] != '']
        print(f"Rows after Site ID cleaning: {len(relevant_calls)}")
        
        if relevant_calls.empty:
            print("❌ No calls with valid Site IDs")
            return get_empty_movement_result()

        daily_movements = {}
        weekly_movements = {}
        all_movements = []

        # ===== Generate daily movements =====
        print("\n--- Generating Daily Movements ---")
        for date, day_data in relevant_calls.groupby('DateOnly'):
            day_data = day_data.reset_index(drop=True)
            day_movements = []
            day_locations = []
            
            for i in range(len(day_data) - 1):
                current = day_data.iloc[i]
                next_record = day_data.iloc[i + 1]
                
                current_site_data, _ = find_site_info(current['Site ID'], site_info)
                next_site_data, _ = find_site_info(next_record['Site ID'], site_info)
                
                if (current_site_data and next_site_data and 
                    current_site_data.get('lat') and next_site_data.get('lat')):
                    try:
                        curr_lat = float(current_site_data['lat'])
                        curr_lon = float(current_site_data['long'])
                        next_lat = float(next_site_data['lat'])
                        next_lon = float(next_site_data['long'])
                        
                        distance = geodesic((curr_lat, curr_lon), (next_lat, next_lon)).kilometers

                        if distance > 0:
                            movement = {
                                'from_site': {
                                    'id': str(current['Site ID']),
                                    'name': current_site_data['name'],
                                    'lat': curr_lat,
                                    'lon': curr_lon
                                },
                                'to_site': {
                                    'id': str(next_record['Site ID']),
                                    'name': next_site_data['name'],
                                    'lat': next_lat,
                                    'lon': next_lon
                                },
                                'distance': round(distance, 2),
                                'timestamp': current['Date'].strftime('%Y-%m-%d %H:%M:%S')
                            }
                            day_movements.append(movement)
                            all_movements.append(movement)
                            
                            for site in [movement['from_site'], movement['to_site']]:
                                if site['id'] not in [loc['id'] for loc in day_locations]:
                                    day_locations.append(site)

                    except Exception as e:
                        print(f"Error calculating distance for day {date}: {str(e)}")
                        continue

            if day_movements:
                date_str = date.strftime('%Y-%m-%d')
                daily_movements[date_str] = {
                    'movements': day_movements,
                    'locations': day_locations,
                    'total_distance': round(sum(m['distance'] for m in day_movements), 2),
                    'total_movements': len(day_movements)
                }
                print(f"  {date_str}: {len(day_movements)} movements, {len(day_locations)} locations")

        # ===== Generate weekly movements =====
        print("\n--- Generating Weekly Movements ---")
        for week, week_data in relevant_calls.groupby('WeekYear'):
            week_data = week_data.reset_index(drop=True)
            week_movements = []
            week_locations = []
            
            for i in range(len(week_data) - 1):
                current = week_data.iloc[i]
                next_record = week_data.iloc[i + 1]
                
                current_site_data, _ = find_site_info(current['Site ID'], site_info)
                next_site_data, _ = find_site_info(next_record['Site ID'], site_info)
                
                if (current_site_data and next_site_data and 
                    current_site_data.get('lat') and next_site_data.get('lat')):
                    try:
                        curr_lat = float(current_site_data['lat'])
                        curr_lon = float(current_site_data['long'])
                        next_lat = float(next_site_data['lat'])
                        next_lon = float(next_site_data['long'])
                        
                        distance = geodesic((curr_lat, curr_lon), (next_lat, next_lon)).kilometers

                        if distance > 0:
                            movement = {
                                'from_site': {
                                    'id': str(current['Site ID']),
                                    'name': current_site_data['name'],
                                    'lat': curr_lat,
                                    'lon': curr_lon
                                },
                                'to_site': {
                                    'id': str(next_record['Site ID']),
                                    'name': next_site_data['name'],
                                    'lat': next_lat,
                                    'lon': next_lon
                                },
                                'distance': round(distance, 2),
                                'timestamp': current['Date'].strftime('%Y-%m-%d %H:%M:%S')
                            }
                            week_movements.append(movement)
                            
                            for site in [movement['from_site'], movement['to_site']]:
                                if site['id'] not in [loc['id'] for loc in week_locations]:
                                    week_locations.append(site)

                    except Exception as e:
                        print(f"Error calculating distance for week {week}: {str(e)}")
                        continue

            if week_movements:
                weekly_movements[week] = {
                    'movements': week_movements,
                    'locations': week_locations,
                    'total_distance': round(sum(m['distance'] for m in week_movements), 2),
                    'total_movements': len(week_movements)
                }
                print(f"  {week}: {len(week_movements)} movements, {len(week_locations)} locations")

        movement_stats = calculate_movement_stats(all_movements)

        result = {
            'daily_movements': {
                'days': sorted(list(daily_movements.keys())),
                'movements': daily_movements
            },
            'weekly_movements': {
                'weeks': sorted(list(weekly_movements.keys())),
                'movements': weekly_movements
            },
            'movement_stats': movement_stats
        }

        print(f"\n=== Movement Analysis Complete ===")
        print(f"Daily movements: {len(daily_movements)} days")
        print(f"Weekly movements: {len(weekly_movements)} weeks")
        print(f"Total movements: {len(all_movements)}")
        print(f"Total distance: {movement_stats['total_distance']} km")

        return result

    except Exception as e:
        print(f"❌ Error in analyze_movement_patterns_z: {str(e)}")
        import traceback
        traceback.print_exc()
        return get_empty_movement_result()


# ===== Helper Functions - KEPT ORIGINAL =====

def generate_daily_movements_original(df):
    """Generate movements grouped by day for original format"""
    daily_movements = {}
    
    for date, day_data in df.groupby('DateOnly'):
        day_movements = []
        day_locations = []
        
        for i in range(len(day_data) - 1):
            current_row = day_data.iloc[i]
            next_row = day_data.iloc[i + 1]
            
            try:
                distance = geodesic(
                    (float(current_row['LAT']), float(current_row['LON'])),
                    (float(next_row['LAT']), float(next_row['LON']))
                ).kilometers

                if distance > 0:
                    movement = {
                        'from_site': {
                            'id': str(current_row['SITE_ID']),
                            'name': str(current_row['SITE_NAME']),
                            'lat': float(current_row['LAT']),
                            'lon': float(current_row['LON'])
                        },
                        'to_site': {
                            'id': str(next_row['SITE_ID']),
                            'name': str(next_row['SITE_NAME']),
                            'lat': float(next_row['LAT']),
                            'lon': float(next_row['LON'])
                        },
                        'distance': round(distance, 2),
                        'timestamp': current_row['CALL_INITIAL_TIME'].strftime('%Y-%m-%d %H:%M:%S')
                    }
                    day_movements.append(movement)
                    
                    for site in [movement['from_site'], movement['to_site']]:
                        if site['id'] not in [loc['id'] for loc in day_locations]:
                            day_locations.append(site)

            except Exception as e:
                print(f"Error calculating distance: {str(e)}")

        if day_movements:
            daily_movements[date.strftime('%Y-%m-%d')] = {
                'movements': day_movements,
                'locations': day_locations,
                'total_distance': round(sum(m['distance'] for m in day_movements), 2),
                'total_movements': len(day_movements)
            }
    
    return {
        'days': list(daily_movements.keys()),
        'movements': daily_movements
    }


def generate_weekly_movements_original(df):
    """Generate movements grouped by week for original format"""
    weekly_movements = {}
    
    for week, week_data in df.groupby('WeekYear'):
        week_movements = []
        week_locations = []
        
        for i in range(len(week_data) - 1):
            current_row = week_data.iloc[i]
            next_row = week_data.iloc[i + 1]
            
            try:
                distance = geodesic(
                    (float(current_row['LAT']), float(current_row['LON'])),
                    (float(next_row['LAT']), float(next_row['LON']))
                ).kilometers

                if distance > 0:
                    movement = {
                        'from_site': {
                            'id': str(current_row['SITE_ID']),
                            'name': str(current_row['SITE_NAME']),
                            'lat': float(current_row['LAT']),
                            'lon': float(current_row['LON'])
                        },
                        'to_site': {
                            'id': str(next_row['SITE_ID']),
                            'name': str(next_row['SITE_NAME']),
                            'lat': float(next_row['LAT']),
                            'lon': float(next_row['LON'])
                        },
                        'distance': round(distance, 2),
                        'timestamp': current_row['CALL_INITIAL_TIME'].strftime('%Y-%m-%d %H:%M:%S')
                    }
                    week_movements.append(movement)
                    
                    for site in [movement['from_site'], movement['to_site']]:
                        if site['id'] not in [loc['id'] for loc in week_locations]:
                            week_locations.append(site)

            except Exception as e:
                print(f"Error calculating distance: {str(e)}")

        if week_movements:
            weekly_movements[week] = {
                'movements': week_movements,
                'locations': week_locations,
                'total_distance': round(sum(m['distance'] for m in week_movements), 2),
                'total_movements': len(week_movements)
            }
    
    return {
        'weeks': list(weekly_movements.keys()),
        'movements': weekly_movements
    }


def generate_daily_movements_z(df, site_info):
    """Generate movements grouped by day for Z format"""
    daily_movements = {}
    
    for date, day_data in df.groupby('DateOnly'):
        day_movements = []
        day_locations = []
        
        for i in range(len(day_data) - 1):
            current_row = day_data.iloc[i]
            next_row = day_data.iloc[i + 1]
            
            current_site_data, _ = find_site_info(current_row['Site ID'], site_info)
            next_site_data, _ = find_site_info(next_row['Site ID'], site_info)
            
            if current_site_data['lat'] and next_site_data['lat']:
                try:
                    distance = geodesic(
                        (float(current_site_data['lat']), float(current_site_data['long'])),
                        (float(next_site_data['lat']), float(next_site_data['long']))
                    ).kilometers

                    if distance > 0:
                        movement = {
                            'from_site': {
                                'id': str(current_row['Site ID']),
                                'name': current_site_data['name'],
                                'lat': float(current_site_data['lat']),
                                'lon': float(current_site_data['long'])
                            },
                            'to_site': {
                                'id': str(next_row['Site ID']),
                                'name': next_site_data['name'],
                                'lat': float(next_site_data['lat']),
                                'lon': float(next_site_data['long'])
                            },
                            'distance': round(distance, 2),
                            'timestamp': current_row['Date'].strftime('%Y-%m-%d %H:%M:%S')
                        }
                        day_movements.append(movement)
                        
                        for site in [movement['from_site'], movement['to_site']]:
                            if site['id'] not in [loc['id'] for loc in day_locations]:
                                day_locations.append(site)

                except Exception as e:
                    print(f"Error calculating distance: {str(e)}")

        if day_movements:
            daily_movements[date.strftime('%Y-%m-%d')] = {
                'movements': day_movements,
                'locations': day_locations,
                'total_distance': round(sum(m['distance'] for m in day_movements), 2),
                'total_movements': len(day_movements)
            }
    
    return {
        'days': list(daily_movements.keys()),
        'movements': daily_movements
    }


def generate_weekly_movements_z(df, site_info):
    """Generate movements grouped by week for Z format"""
    weekly_movements = {}
    
    for week, week_data in df.groupby('WeekYear'):
        week_movements = []
        week_locations = []
        
        for i in range(len(week_data) - 1):
            current_row = week_data.iloc[i]
            next_row = week_data.iloc[i + 1]
            
            current_site_data, _ = find_site_info(current_row['Site ID'], site_info)
            next_site_data, _ = find_site_info(next_row['Site ID'], site_info)
            
            if current_site_data['lat'] and next_site_data['lat']:
                try:
                    distance = geodesic(
                        (float(current_site_data['lat']), float(current_site_data['long'])),
                        (float(next_site_data['lat']), float(next_site_data['long']))
                    ).kilometers

                    if distance > 0:
                        movement = {
                            'from_site': {
                                'id': str(current_row['Site ID']),
                                'name': current_site_data['name'],
                                'lat': float(current_site_data['lat']),
                                'lon': float(current_site_data['long'])
                            },
                            'to_site': {
                                'id': str(next_row['Site ID']),
                                'name': next_site_data['name'],
                                'lat': float(next_site_data['lat']),
                                'lon': float(next_site_data['long'])
                            },
                            'distance': round(distance, 2),
                            'timestamp': current_row['Date'].strftime('%Y-%m-%d %H:%M:%S')
                        }
                        week_movements.append(movement)
                        
                        for site in [movement['from_site'], movement['to_site']]:
                            if site['id'] not in [loc['id'] for loc in week_locations]:
                                week_locations.append(site)

                except Exception as e:
                    print(f"Error calculating distance: {str(e)}")

        if week_movements:
            weekly_movements[week] = {
                'movements': week_movements,
                'locations': week_locations,
                'total_distance': round(sum(m['distance'] for m in week_movements), 2),
                'total_movements': len(week_movements)
            }
    
    return {
        'weeks': list(weekly_movements.keys()),
        'movements': weekly_movements
    }


def calculate_movement_stats(movements):
    """Calculate statistics about movements"""
    if not movements:
        return get_empty_movement_stats()

    distances = [m['distance'] for m in movements]
    return {
        'total_distance': round(sum(distances), 2),
        'average_distance': round(sum(distances) / len(distances), 2) if distances else 0,
        'max_distance': round(max(distances), 2) if distances else 0,
        'min_distance': round(min(distances), 2) if distances else 0,
        'total_movements': len(movements)
    }


def get_empty_movement_stats():
    """Return empty movement statistics structure"""
    return {
        'total_distance': 0,
        'average_distance': 0,
        'max_distance': 0,
        'min_distance': 0,
        'total_movements': 0
    }


def get_empty_movement_result():
    """Return empty movement analysis result structure"""
    return {
        'daily_movements': {
            'days': [],
            'movements': {}
        },
        'weekly_movements': {
            'weeks': [],
            'movements': {}
        },
        'movement_stats': get_empty_movement_stats()
    }