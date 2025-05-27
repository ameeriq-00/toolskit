from django.db import models

# Create your models here.

class SiteInformation(models.Model):
    governorate = models.CharField(max_length=100)
    site_enb_id = models.CharField(max_length=100)
    cell_id = models.CharField(max_length=100)
    site_name = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    bore = models.FloatField()
    lac_cell_id_ecgi = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.site_name} ({self.site_enb_id})"
class TwoGSiteInformation(models.Model):
    """معلومات أبراج 2G"""
    bsc = models.CharField(max_length=100, verbose_name="BSC")
    site_name = models.CharField(max_length=200, verbose_name="Site Name")
    site_id = models.CharField(max_length=100, verbose_name="Site ID")
    cell_id = models.CharField(max_length=100, verbose_name="Cell ID")
    geo_city = models.CharField(max_length=100, verbose_name="Geo-City")
    lac = models.CharField(max_length=50, verbose_name="LAC")
    mcc = models.CharField(max_length=10, verbose_name="MCC")
    mnc = models.CharField(max_length=10, verbose_name="MNC")
    longitude = models.FloatField(verbose_name="Longitude")
    latitude = models.FloatField(verbose_name="Latitude")
    mechanical_tilt = models.FloatField(verbose_name="Mechanical Tilt", null=True, blank=True)
    electrical_tilt = models.FloatField(verbose_name="Electrical Tilt", null=True, blank=True)
    azimuth = models.FloatField(verbose_name="Azimuth", null=True, blank=True)
    antenna_height = models.FloatField(verbose_name="Antenna Height", null=True, blank=True)
    antenna_beam_width = models.FloatField(verbose_name="Antenna Beam Width", null=True, blank=True)
    
    # إضافة timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "2G Site Information"
        verbose_name_plural = "2G Sites Information"
        unique_together = ('site_id', 'cell_id')

    def __str__(self):
        return f"2G: {self.site_name} ({self.site_id}-{self.cell_id})"


class ThreeGSiteInformation(models.Model):
    """معلومات أبراج 3G"""
    rnc = models.CharField(max_length=100, verbose_name="RNC")
    site_id = models.CharField(max_length=100, verbose_name="Site ID")  
    cell_id = models.CharField(max_length=100, verbose_name="Cell ID")
    full_site_name = models.CharField(max_length=200, verbose_name="Full Site Name")
    cell_name = models.CharField(max_length=200, verbose_name="Cell Name")
    lac = models.CharField(max_length=50, verbose_name="LAC")
    geo_city = models.CharField(max_length=100, verbose_name="Geo-City")
    longitude = models.FloatField(verbose_name="Longitude")
    latitude = models.FloatField(verbose_name="Latitude")
    azimuth = models.FloatField(verbose_name="Azimuth", null=True, blank=True)
    mechanical_tilt = models.FloatField(verbose_name="Mechanical Tilt", null=True, blank=True)
    electrical_tilt = models.FloatField(verbose_name="Electrical Tilt", null=True, blank=True)
    antenna_height = models.FloatField(verbose_name="Antenna Height", null=True, blank=True)
    
    # إضافة timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "3G Site Information"
        verbose_name_plural = "3G Sites Information"
        unique_together = ('site_id', 'cell_id')

    def __str__(self):
        return f"3G: {self.full_site_name} ({self.site_id}-{self.cell_id})"


class FourGSiteInformation(models.Model):
    """معلومات أبراج 4G"""
    site_id = models.CharField(max_length=100, verbose_name="Site ID")
    cell_id = models.CharField(max_length=100, verbose_name="Cell ID")
    province_id = models.CharField(max_length=10, verbose_name="Province ID")
    geo_city = models.CharField(max_length=100, verbose_name="GEO City")
    full_site_name = models.CharField(max_length=200, verbose_name="Full Site Name")
    cell_name = models.CharField(max_length=200, verbose_name="Cell Name")
    technology = models.CharField(max_length=10, verbose_name="Technology", default="4G")
    lac_tac = models.CharField(max_length=50, verbose_name="LAC/TAC")
    antenna_height = models.FloatField(verbose_name="Antenna Height", null=True, blank=True)
    azimuth = models.FloatField(verbose_name="Azimuth", null=True, blank=True)
    rf_plan_longitude = models.FloatField(verbose_name="RF Plan Longitude")
    rf_plan_latitude = models.FloatField(verbose_name="RF Plan Latitude")
    
    # إضافة timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "4G Site Information"
        verbose_name_plural = "4G Sites Information"
        unique_together = ('site_id', 'cell_id')

    def __str__(self):
        return f"4G: {self.full_site_name} ({self.site_id}-{self.cell_id})"

class ExcelAnalysisResult(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    sheet_owner_number = models.CharField(max_length=20)
    filtered_calls = models.JSONField()
    imei_usage = models.JSONField()
    most_visited_sites = models.JSONField()

    def __str__(self):
        return f"Analysis for {self.sheet_owner_number} at {self.created_at}"

class SiteInformationUpload(models.Model):
    file = models.FileField(upload_to='site_information/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Site Information uploaded at {self.uploaded_at}"

# Keep the existing models if any
