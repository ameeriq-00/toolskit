# backend/api/services/comparison_analyzer.py
"""
Comparison Analyzer Service
Analyzes overlap and relationships between multiple call sheets
"""
import pandas as pd
import numpy as np
from collections import defaultdict
import itertools
from .site_service import SiteService


class ComparisonAnalyzer:
    def __init__(self):
        self.site_service = SiteService()

    def analyze_multiple_sheets(self, files_data):
        """
        Analyze multiple call sheets for overlap and relationships
        files_data: list of dicts with format: [{'file': file_obj, 'name': 'Person A', 'format': 'standard/z'}]
        """
        try:
            # Process each file and extract call data
            processed_sheets = []
            
            for file_info in files_data:
                sheet_data = self.process_single_sheet(
                    file_info['file'], 
                    file_info['name'], 
                    file_info['format']
                )
                if sheet_data:
                    processed_sheets.append(sheet_data)
            
            if len(processed_sheets) < 2:
                return {"error": "Need at least 2 valid sheets for comparison"}
            
            # Perform comparison analysis
            results = {
                "sheets_info": [
                    {
                        "name": sheet['name'],
                        "total_numbers": len(sheet['all_numbers']),
                        "unique_numbers": len(sheet['unique_numbers']),
                        "total_calls": sheet['total_calls']
                    } for sheet in processed_sheets
                ],
                "pairwise_comparisons": self.calculate_pairwise_overlaps(processed_sheets),
                "common_contacts": self.find_common_contacts(processed_sheets),
                "network_analysis": self.build_network_graph(processed_sheets),
                "overlap_matrix": self.create_overlap_matrix(processed_sheets)
            }
            
            return results
            
        except Exception as e:
            print(f"Error in analyze_multiple_sheets: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    def process_single_sheet(self, file, sheet_name, format_type):
        """Process a single sheet and extract call information"""
        try:
            if format_type == 'standard':
                df = pd.read_excel(file)
                calling_col = 'CALLER_NUMBER'
                called_col = 'CALLED_NUMBER'
                skip_rows = 0
            else:  # z format
                df = pd.read_excel(file, skiprows=5)
                calling_col = 'Calling Number'
                called_col = 'Called Number'
                skip_rows = 5

            # Clean and process numbers
            df[calling_col] = df[calling_col].astype(str).apply(self.process_number)
            df[called_col] = df[called_col].astype(str).apply(self.process_number)
            
            # Filter valid numbers
            valid_calling = df[df[calling_col].apply(self.is_valid_phone_number)][calling_col]
            valid_called = df[df[called_col].apply(self.is_valid_phone_number)][called_col]
            
            # Get all numbers this person communicated with
            all_numbers = pd.concat([valid_calling, valid_called]).tolist()
            unique_numbers = set(all_numbers)
            
            # Find the sheet owner (most frequent number)
            number_counts = pd.Series(all_numbers).value_counts()
            sheet_owner = number_counts.index[0] if len(number_counts) > 0 else None
            
            # Remove sheet owner from contacts (they don't call themselves)
            unique_numbers.discard(sheet_owner)
            
            # Create call relationships
            call_relationships = []
            for _, row in df.iterrows():
                caller = self.process_number(row[calling_col])
                called = self.process_number(row[called_col])
                
                if (self.is_valid_phone_number(caller) and 
                    self.is_valid_phone_number(called) and 
                    caller != called):
                    call_relationships.append({
                        'from': caller,
                        'to': called,
                        'type': 'outgoing' if caller == sheet_owner else 'incoming'
                    })
            
            return {
                'name': sheet_name,
                'sheet_owner': sheet_owner,
                'all_numbers': all_numbers,
                'unique_numbers': unique_numbers,
                'total_calls': len(all_numbers),
                'call_relationships': call_relationships
            }
            
        except Exception as e:
            print(f"Error processing sheet {sheet_name}: {str(e)}")
            return None

    def process_number(self, number):
        """Clean and process phone number"""
        number_str = str(number).strip()
        if number_str.startswith('964'):
            return number_str[3:]
        return number_str

    def is_valid_phone_number(self, number):
        """Validate phone number"""
        number_str = str(number).strip()
        return (number_str.isdigit() and 
                5 <= len(number_str) <= 15)

    def calculate_pairwise_overlaps(self, sheets):
        """Calculate overlap percentages between each pair of sheets"""
        overlaps = []
        
        for i in range(len(sheets)):
            for j in range(i + 1, len(sheets)):
                sheet_a = sheets[i]
                sheet_b = sheets[j]
                
                # Calculate overlapping contacts
                overlap = sheet_a['unique_numbers'].intersection(sheet_b['unique_numbers'])
                
                # Calculate percentages
                overlap_count = len(overlap)
                total_a = len(sheet_a['unique_numbers'])
                total_b = len(sheet_b['unique_numbers'])
                
                percentage_a = (overlap_count / total_a * 100) if total_a > 0 else 0
                percentage_b = (overlap_count / total_b * 100) if total_b > 0 else 0
                
                overlaps.append({
                    'sheet_a': sheet_a['name'],
                    'sheet_b': sheet_b['name'],
                    'common_contacts': overlap_count,
                    'overlap_percentage_a': round(percentage_a, 2),
                    'overlap_percentage_b': round(percentage_b, 2),
                    'common_numbers': list(overlap)
                })
        
        return overlaps

    def find_common_contacts(self, sheets):
        """Find contacts that appear in multiple sheets"""
        # Count how many sheets each number appears in
        number_appearances = defaultdict(list)
        
        for sheet in sheets:
            for number in sheet['unique_numbers']:
                number_appearances[number].append(sheet['name'])
        
        # Group by appearance count
        common_contacts = {}
        for number, appearing_sheets in number_appearances.items():
            if len(appearing_sheets) > 1:
                count = len(appearing_sheets)
                if count not in common_contacts:
                    common_contacts[count] = []
                common_contacts[count].append({
                    'number': number,
                    'appears_in': appearing_sheets
                })
        
        return common_contacts

    def build_network_graph(self, sheets):
        """Build network graph data for visualization"""
        nodes = []
        links = []
        
        # Add sheet owners as main nodes
        for sheet in sheets:
            nodes.append({
                'id': sheet['sheet_owner'],
                'name': sheet['name'],
                'type': 'owner',
                'size': 20,
                'color': '#ff6b6b'
            })
        
        # Add common contacts as nodes
        all_contacts = set()
        for sheet in sheets:
            all_contacts.update(sheet['unique_numbers'])
        
        # Count appearances for sizing
        contact_counts = defaultdict(int)
        for sheet in sheets:
            for contact in sheet['unique_numbers']:
                contact_counts[contact] += 1
        
        # Add contact nodes
        for contact in all_contacts:
            appearances = contact_counts[contact]
            nodes.append({
                'id': contact,
                'name': contact,
                'type': 'contact',
                'appearances': appearances,
                'size': max(5, appearances * 3),
                'color': '#4ecdc4' if appearances > 1 else '#95e1d3'
            })
        
        # Create links between owners and their contacts
        for sheet in sheets:
            for contact in sheet['unique_numbers']:
                links.append({
                    'source': sheet['sheet_owner'],
                    'target': contact,
                    'sheet': sheet['name']
                })
        
        return {
            'nodes': nodes,
            'links': links
        }

    def create_overlap_matrix(self, sheets):
        """Create matrix showing overlap percentages between all sheets"""
        n = len(sheets)
        matrix = []
        
        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    row.append(100)  # Same sheet = 100% overlap
                else:
                    # Find overlap percentage
                    overlap = sheets[i]['unique_numbers'].intersection(sheets[j]['unique_numbers'])
                    total_i = len(sheets[i]['unique_numbers'])
                    percentage = (len(overlap) / total_i * 100) if total_i > 0 else 0
                    row.append(round(percentage, 1))
            matrix.append(row)
        
        return {
            'matrix': matrix,
            'labels': [sheet['name'] for sheet in sheets]
        }