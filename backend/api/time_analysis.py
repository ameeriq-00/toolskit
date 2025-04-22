import pandas as pd
import numpy as np
from datetime import datetime

def analyze_time_patterns_original(df):
    """
    Analyze time patterns for original Excel analyzer
    """
    try:
        print("Starting time pattern analysis for original format")
        print("Initial columns:", df.columns.tolist())

        # Handle the CALL_INITIAL_TIME column
        if not pd.api.types.is_datetime64_any_dtype(df['CALL_INITIAL_TIME']):
            if pd.api.types.is_string_dtype(df['CALL_INITIAL_TIME']):
                df['CALL_INITIAL_TIME'] = pd.to_datetime(
                    df['CALL_INITIAL_TIME'].astype(str).str.strip(), 
                    format='%d/%m/%Y %H:%M:%S', 
                    errors='coerce'
                )
            else:
                df['CALL_INITIAL_TIME'] = pd.to_datetime(df['CALL_INITIAL_TIME'], errors='coerce')

        df_clean = df.dropna(subset=['CALL_INITIAL_TIME'])
        print(f"Number of valid dates: {len(df_clean)}")

        # Add necessary time components
        df_clean['Hour'] = df_clean['CALL_INITIAL_TIME'].dt.hour
        df_clean['Weekday'] = df_clean['CALL_INITIAL_TIME'].dt.day_name()
        df_clean['Week'] = df_clean['CALL_INITIAL_TIME'].dt.isocalendar().week
        df_clean['DateOnly'] = df_clean['CALL_INITIAL_TIME'].dt.date
        df_clean['DayPeriod'] = pd.cut(
            df_clean['Hour'], 
            bins=[0, 6, 12, 18, 24], 
            labels=['Night', 'Morning', 'Afternoon', 'Evening']
        )

        # Perform analysis
        analysis = {
            "hourly_distribution": get_hourly_distribution_original(df_clean),
            "daily_patterns": get_daily_patterns_original(df_clean),
            "weekly_patterns": get_weekly_patterns_original(df_clean),
            "peak_times": get_peak_times_original(df_clean),
            "day_periods": get_day_period_analysis_original(df_clean),
            "weekend_vs_weekday": get_weekend_analysis_original(df_clean),
            "activity_spikes": detect_activity_spikes_original(df_clean),
            "consistency_scores": calculate_consistency_scores_original(df_clean),
            "statistical_summary": get_statistical_summary_original(df_clean)
        }

        print("Time analysis completed successfully")
        return analysis

    except Exception as e:
        print(f"Error in analyze_time_patterns_original: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def analyze_time_patterns_z(df, sheet_owner_number):
    """
    Analyze time patterns for Excel analyzer Z
    """
    try:
        print("\nStarting Z format analysis...")
        
        # Convert date column to datetime safely
        if not pd.api.types.is_datetime64_any_dtype(df['Date']):
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        
        # Filter for sheet owner's calls
        owner_calls = df[
            (df['Calling Number'].astype(str) == str(sheet_owner_number)) |
            (df['Called Number'].astype(str) == str(sheet_owner_number))
        ]
        
        df_clean = owner_calls.dropna(subset=['Date'])

        # Add all time components needed for analysis
        df_clean['Hour'] = df_clean['Date'].dt.hour
        df_clean['Weekday'] = df_clean['Date'].dt.day_name()
        df_clean['Week'] = df_clean['Date'].dt.isocalendar().week
        df_clean['DateOnly'] = df_clean['Date'].dt.date
        df_clean['DayPeriod'] = pd.cut(df_clean['Hour'], 
                                     bins=[0, 6, 12, 18, 24], 
                                     labels=['Night', 'Morning', 'Afternoon', 'Evening'])

        # Calculate all analyses
        analysis = {
            "hourly_distribution": get_hourly_distribution_z(df_clean),
            "daily_patterns": get_daily_patterns_z(df_clean),
            "weekly_patterns": get_weekly_patterns_z(df_clean),
            "peak_times": get_peak_times_z(df_clean),
            "day_periods": get_day_period_analysis_z(df_clean),
            "weekend_vs_weekday": get_weekend_analysis_z(df_clean),
            "activity_spikes": detect_activity_spikes_z(df_clean),
            "consistency_scores": calculate_consistency_scores_z(df_clean),
            "statistical_summary": get_statistical_summary_z(df_clean)
        }

        print("Time analysis completed successfully")
        return analysis

    except Exception as e:
        print(f"Error in analyze_time_patterns_z: {str(e)}")
        import traceback
        traceback.print_exc()
        return get_empty_time_analysis()


# Helper functions for original format
def get_hourly_distribution_original(df):
    try:
        print("Getting hourly distribution original...")
        df_clean = df.dropna(subset=['CALL_INITIAL_TIME'])
        hourly_counts = df_clean['CALL_INITIAL_TIME'].dt.hour.value_counts().sort_index()
        print(f"Found {len(hourly_counts)} hours with data")
        return {
            "hours": list(hourly_counts.index),
            "counts": list(hourly_counts.values)
        }
    except Exception as e:
        print(f"Error in get_hourly_distribution_original: {str(e)}")
        return {"hours": [], "counts": []}


def get_daily_patterns_original(df):
    try:
        print("Getting daily patterns original...")
        df_clean = df.dropna(subset=['CALL_INITIAL_TIME'])
        daily_counts = df_clean['CALL_INITIAL_TIME'].dt.day_name().value_counts()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_counts = daily_counts.reindex(day_order, fill_value=0)
        print(f"Found data for {len(daily_counts)} days")
        return {
            "days": list(daily_counts.index),
            "counts": list(daily_counts.values)
        }
    except Exception as e:
        print(f"Error in get_daily_patterns_original: {str(e)}")
        return {"days": [], "counts": []}


def get_weekly_patterns_original(df):
    df_clean = df.dropna(subset=['CALL_INITIAL_TIME'])
    df_clean['week'] = df_clean['CALL_INITIAL_TIME'].dt.isocalendar().week
    weekly_counts = df_clean.groupby('week').size()
    return {
        "weeks": list(weekly_counts.index),
        "counts": list(weekly_counts.values)
    }

def get_peak_times_original(df):
    df_clean = df.dropna(subset=['CALL_INITIAL_TIME'])
    hourly_peaks = df_clean['CALL_INITIAL_TIME'].dt.hour.value_counts().nlargest(3)
    daily_peaks = df_clean['CALL_INITIAL_TIME'].dt.day_name().value_counts().nlargest(3)
    
    return {
        "peak_hours": [{"hour": int(hour), "count": int(count)} for hour, count in hourly_peaks.items()],
        "peak_days": [{"day": str(day), "count": int(count)} for day, count in daily_peaks.items()]
    }

def get_day_period_analysis_original(df):
    df['Hour'] = df['CALL_INITIAL_TIME'].dt.hour
    df['DayPeriod'] = pd.cut(df['Hour'], 
                            bins=[0, 6, 12, 18, 24], 
                            labels=['Night', 'Morning', 'Afternoon', 'Evening'])
    period_counts = df['DayPeriod'].value_counts()
    
    return {
        "periods": list(period_counts.index),
        "counts": list(period_counts.values)
    }

def get_weekend_analysis_original(df):
    df['Weekday'] = df['CALL_INITIAL_TIME'].dt.day_name()
    df['is_weekend'] = df['Weekday'].isin(['Saturday', 'Sunday'])
    weekend_analysis = df.groupby('is_weekend').size()
    
    weekend_calls = weekend_analysis.get(True, 0)
    weekday_calls = weekend_analysis.get(False, 0)
    total_weekends = df[df['is_weekend']]['CALL_INITIAL_TIME'].dt.date.nunique()
    total_weekdays = df[~df['is_weekend']]['CALL_INITIAL_TIME'].dt.date.nunique()
    
    return {
        "weekend_total": int(weekend_calls),
        "weekday_total": int(weekday_calls),
        "avg_weekend_calls": float(weekend_calls / max(total_weekends, 1)),
        "avg_weekday_calls": float(weekday_calls / max(total_weekdays, 1))
    }

def detect_activity_spikes_original(df):
    hourly_counts = df.groupby([df['CALL_INITIAL_TIME'].dt.date, 
                               df['CALL_INITIAL_TIME'].dt.hour]).size()
    mean_calls = hourly_counts.mean()
    std_calls = hourly_counts.std()
    threshold = mean_calls + (2 * std_calls)
    
    spikes = hourly_counts[hourly_counts > threshold]
    return [{
        "date": date[0].strftime('%Y-%m-%d'),
        "hour": int(date[1]),
        "calls": int(count),
        "normal_range": float(mean_calls + std_calls)
    } for date, count in spikes.items()]

def calculate_consistency_scores_original(df):
    hourly_std = df.groupby(df['CALL_INITIAL_TIME'].dt.hour).size().std()
    daily_std = df.groupby(df['CALL_INITIAL_TIME'].dt.day_name()).size().std()
    
    return {
        "hourly_consistency": float(1 / (1 + hourly_std)),
        "daily_consistency": float(1 / (1 + daily_std)),
        "pattern_score": float(1 / (1 + hourly_std + daily_std))
    }

def get_statistical_summary_original(df):
    """Get comprehensive statistical summary for original format"""
    try:
        # Calculate date components first
        df['DateOnly'] = df['CALL_INITIAL_TIME'].dt.date
        df['Hour'] = df['CALL_INITIAL_TIME'].dt.hour
        
        # Group by date and calculate statistics
        daily_counts = df.groupby('DateOnly').size()
        hourly_counts = df.groupby(['DateOnly', 'Hour']).size()
        unique_hours = df.groupby('DateOnly')['Hour'].nunique()
        
        return {
            "total_calls": len(df),
            "unique_days": len(daily_counts),
            "calls_per_day": {
                "mean": float(daily_counts.mean()),
                "median": float(daily_counts.median()),
                "std": float(daily_counts.std())
            },
            "active_hours_per_day": float(unique_hours.mean()),
            "data_span_days": (max(df['DateOnly']) - min(df['DateOnly'])).days
        }
    except Exception as e:
        print(f"Error in get_statistical_summary_original: {str(e)}")
        return {
            "total_calls": 0,
            "unique_days": 0,
            "calls_per_day": {
                "mean": 0,
                "median": 0,
                "std": 0
            },
            "active_hours_per_day": 0,
            "data_span_days": 0
        }


# Helper functions for Z format
def get_hourly_distribution_z(df):
    try:
        hourly_counts = df['Hour'].value_counts().sort_index()
        return {
            "hours": list(hourly_counts.index),
            "counts": list(hourly_counts.values)
        }
    except Exception as e:
        print(f"Error in get_hourly_distribution_z: {str(e)}")
        return {"hours": [], "counts": []}


def get_daily_patterns_z(df):
    try:
        daily_counts = df['Weekday'].value_counts()
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_counts = daily_counts.reindex(day_order, fill_value=0)
        return {
            "days": list(daily_counts.index),
            "counts": list(daily_counts.values)
        }
    except Exception as e:
        print(f"Error in get_daily_patterns_z: {str(e)}")
        return {"days": [], "counts": []}


def get_weekly_patterns_z(df):
    """Enhanced weekly patterns analysis for Z format"""
    try:
        # Use Date directly instead of groupby.dt
        df['Week'] = df['Date'].dt.isocalendar().week
        weekly_counts = df.groupby('Week').size()
        
        return {
            "weeks": list(weekly_counts.index),
            "counts": list(weekly_counts.values),
            "statistics": {
                "mean_weekly_calls": float(weekly_counts.mean()),
                "std_weekly_calls": float(weekly_counts.std()),
                "peak_week": int(weekly_counts.idxmax()),
                "peak_week_calls": int(weekly_counts.max())
            }
        }
    except Exception as e:
        print(f"Error in get_weekly_patterns_z: {str(e)}")
        return {"weeks": [], "counts": [], "statistics": {
            "mean_weekly_calls": 0,
            "std_weekly_calls": 0,
            "peak_week": 0,
            "peak_week_calls": 0
        }}



def get_peak_times_z(df):
    try:
        hourly_peaks = df['Hour'].value_counts().nlargest(3)
        daily_peaks = df['Weekday'].value_counts().nlargest(3)
        
        return {
            "peak_hours": [{"hour": int(hour), "count": int(count)} for hour, count in hourly_peaks.items()],
            "peak_days": [{"day": str(day), "count": int(count)} for day, count in daily_peaks.items()]
        }
    except Exception as e:
        print(f"Error in get_peak_times_z: {str(e)}")
        return {"peak_hours": [], "peak_days": []}


def get_day_period_analysis_z(df):
    df['Hour'] = df['Date'].dt.hour
    df['DayPeriod'] = pd.cut(df['Hour'], 
                            bins=[0, 6, 12, 18, 24], 
                            labels=['Night', 'Morning', 'Afternoon', 'Evening'])
    period_counts = df['DayPeriod'].value_counts()
    
    return {
        "periods": list(period_counts.index),
        "counts": list(period_counts.values)
    }

def get_weekend_analysis_z(df):
    df['Weekday'] = df['Date'].dt.day_name()
    df['is_weekend'] = df['Weekday'].isin(['Saturday', 'Sunday'])
    weekend_analysis = df.groupby('is_weekend').size()
    
    weekend_calls = weekend_analysis.get(True, 0)
    weekday_calls = weekend_analysis.get(False, 0)
    total_weekends = df[df['is_weekend']]['Date'].dt.date.nunique()
    total_weekdays = df[~df['is_weekend']]['Date'].dt.date.nunique()
    
    return {
        "weekend_total": int(weekend_calls),
        "weekday_total": int(weekday_calls),
        "avg_weekend_calls": float(weekend_calls / max(total_weekends, 1)),
        "avg_weekday_calls": float(weekday_calls / max(total_weekdays, 1))
    }

def detect_activity_spikes_z(df):
    """Detect abnormal spikes in activity"""
    try:
        hourly_counts = df.groupby(['DateOnly', 'Hour']).size()
        mean_calls = hourly_counts.mean()
        std_calls = hourly_counts.std()
        threshold = mean_calls + (2 * std_calls)
        
        spikes = hourly_counts[hourly_counts > threshold]
        return [{
            "date": date[0].strftime('%Y-%m-%d'),
            "hour": int(date[1]),
            "calls": int(count),
            "normal_range": float(mean_calls + std_calls)
        } for date, count in spikes.items()]
    except Exception as e:
        print(f"Error in detect_activity_spikes_z: {str(e)}")
        return []


def calculate_consistency_scores_z(df):
    try:
        hourly_std = df.groupby('Hour').size().std()
        daily_std = df.groupby('Weekday').size().std()
        
        return {
            "hourly_consistency": float(1 / (1 + hourly_std)) if hourly_std else 0,
            "daily_consistency": float(1 / (1 + daily_std)) if daily_std else 0,
            "pattern_score": float(1 / (1 + hourly_std + daily_std)) if (hourly_std is not None and daily_std is not None) else 0
        }
    except Exception as e:
        print(f"Error in calculate_consistency_scores_z: {str(e)}")
        return {
            "hourly_consistency": 0,
            "daily_consistency": 0,
            "pattern_score": 0
        }


def get_statistical_summary_z(df):
    """Get comprehensive statistical summary for Z format"""
    try:
        # Convert the grouped date series to date first
        df['DateOnly'] = df['Date'].dt.date
        
        return {
            "total_calls": len(df),
            "unique_days": df['DateOnly'].nunique(),
            "calls_per_day": {
                "mean": float(df.groupby('DateOnly').size().mean()),
                "median": float(df.groupby('DateOnly').size().median()),
                "std": float(df.groupby('DateOnly').size().std())
            },
            "active_hours_per_day": float(df.groupby('DateOnly')['Hour'].nunique().mean()),
            "data_span_days": (max(df['DateOnly']) - min(df['DateOnly'])).days
        }
    except Exception as e:
        print(f"Error in get_statistical_summary_z: {str(e)}")
        return {
            "total_calls": 0,
            "unique_days": 0,
            "calls_per_day": {
                "mean": 0,
                "median": 0,
                "std": 0
            },
            "active_hours_per_day": 0,
            "data_span_days": 0
        }

def get_empty_time_analysis():
    """Return empty structure for time analysis to prevent frontend errors"""
    return {
        "hourly_distribution": {
            "hours": [],
            "counts": [],
            "statistics": {
                "mean": 0,
                "std": 0,
                "peak_hour": 0,
                "peak_count": 0,
                "quiet_hours": []
            }
        },
        "daily_patterns": {
            "days": [],
            "counts": [],
            "statistics": {
                "busiest_day": "",
                "quietest_day": "",
                "average_daily_calls": 0,
                "std_daily_calls": 0
            }
        },
        "weekly_patterns": {
            "weeks": [],
            "counts": []
        },
        "peak_times": {
            "peak_hours": [],
            "peak_days": []
        },
        "day_periods": {
            "periods": [],
            "counts": []
        },
        "weekend_vs_weekday": {
            "weekend_total": 0,
            "weekday_total": 0,
            "avg_weekend_calls": 0,
            "avg_weekday_calls": 0
        },
        "activity_spikes": [],
        "consistency_scores": {
            "hourly_consistency": 0,
            "daily_consistency": 0,
            "pattern_score": 0
        },
        "statistical_summary": {
            "total_calls": 0,
            "unique_days": 0,
            "calls_per_day": {
                "mean": 0,
                "median": 0,
                "std": 0
            },
            "active_hours_per_day": 0,
            "data_span_days": 0
        }
    }