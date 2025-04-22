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
