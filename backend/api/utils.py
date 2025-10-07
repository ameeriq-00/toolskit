# backend/api/utils.py

def find_site_info(site_id, site_info_dict):
    """
    البحث عن معلومات البرج من القاموس
    
    Args:
        site_id: رقم البرج
        site_info_dict: قاموس معلومات الأبراج
    
    Returns:
        tuple: (site_data, site_type) أو (None, None) إذا لم يوجد
    """
    if not site_id or not site_info_dict:
        return None, None
    
    site_id_str = str(site_id).strip()
    
    # البحث في جميع أنواع الأبراج
    for site_type in ['2g', '3g', '4g']:
        if site_type in site_info_dict:
            if site_id_str in site_info_dict[site_type]:
                return site_info_dict[site_type][site_id_str], site_type
    
    return None, None