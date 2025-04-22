from rest_framework import serializers
from .models import SiteInformationUpload

# Add your serializers here if needed

class SiteInformationUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteInformationUpload
        fields = ('file', 'uploaded_at')
