from truecallerpy import search_phonenumber
import json
from datetime import datetime
import time

class TruecallerService:
    def __init__(self, installation_id):
        self.installation_id = installation_id
        
    def search_number(self, phone_number):
        """
        Search for a phone number using truecallerpy v1.0.3
        """
        try:
            # Add delay to avoid rate limiting
            time.sleep(1)  
            
            # Remove any '+' or spaces from the number and ensure it starts with country code
            cleaned_number = str(phone_number).strip().replace('+', '').replace(' ', '')
            if not cleaned_number.startswith('964'):
                cleaned_number = '964' + cleaned_number
            
            # Perform the search with new API parameters
            raw_response = search_phonenumber(
                phone_number=cleaned_number,
                country_code="IQ",
                installation_id=self.installation_id
            )
            
            if not raw_response:
                return {
                    "number": cleaned_number,
                    "name": "Unknown",
                    "type": "Unknown",
                    "provider": "Unknown",
                    "city": "Unknown"
                }

            # Parse the response based on v1.0.3 structure
            response = json.loads(raw_response)
            data = response.get("data", [{}])[0]
            
            return {
                "number": cleaned_number,
                "name": data.get("name", "Unknown"),
                "alter_name": data.get("altName", ""),
                "type": "Business" if data.get("isBusinessTracker") else "Personal",
                "carrier": data.get("phones", [{}])[0].get("carrier") if data.get("phones") else "Unknown",
                "city": data.get("addresses", [{}])[0].get("city") if data.get("addresses") else "Unknown",
                "country": data.get("addresses", [{}])[0].get("countryCode") if data.get("addresses") else "Unknown",
                "tags": data.get("tags", []),
                "spam": data.get("spamInfo", {}).get("spamScore", 0),
                "verified": data.get("verified", False)
            }
            
        except Exception as e:
            print(f"Error searching number {phone_number}: {str(e)}")
            return {
                "number": phone_number,
                "name": "Error",
                "error": str(e)
            }

    def enrich_call_data(self, calls_data):
        """
        Enrich call data with Truecaller information
        calls_data should be a list of dictionaries with 'Number'/'Number_of_Calls' keys
        """
        enriched_data = []
        
        try:
            for call in calls_data:
                number = call.get('Number')
                if not number:
                    continue
                    
                truecaller_info = self.search_number(number)
                enriched_call = {
                    **call,
                    "truecaller_info": truecaller_info
                }
                enriched_data.append(enriched_call)
                
            return enriched_data
        except Exception as e:
            print(f"Error in enrich_call_data: {str(e)}")
            return calls_data  # Return original data if enrichment fails