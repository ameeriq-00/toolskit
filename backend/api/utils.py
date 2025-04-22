def find_site_info(site_id, site_info):
    """Find site information using multiple matching strategies"""
    try:
        site_id = str(site_id).strip()
        
        # Print sample of what we're looking for
        print(f"Looking up site ID: {site_id} in site_info")
        
        if site_id in site_info:
            print(f"Found full match for {site_id}")
            return site_info[site_id], "full_match"
            
        zero_padded = f"0{site_id}"
        if zero_padded in site_info:
            print(f"Found zero-padded match for {site_id}")
            return site_info[zero_padded], "zero_padded_match"
        
        # Try last 5 digits
        if len(site_id) >= 5:
            last_5 = site_id[-5:]
            for key, value in site_info.items():
                if key.endswith(last_5):
                    print(f"Found 5-digit match for {site_id} using {last_5}")
                    return value, "5_digit_match"
        
        # Try last 4 digits
        if len(site_id) >= 4:
            last_4 = site_id[-4:]
            for key, value in site_info.items():
                if key.endswith(last_4):
                    print(f"Found 4-digit match for {site_id} using {last_4}")
                    return value, "4_digit_match"
                    
        print(f"No match found for {site_id}")
        return None, "no_match"
        
    except Exception as e:
        print(f"Error in find_site_info for site_id {site_id}: {str(e)}")
        return None, "error"