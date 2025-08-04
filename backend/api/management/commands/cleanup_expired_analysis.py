# backend/api/management/commands/cleanup_expired_analysis.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import UserAnalysisResult
from datetime import timedelta


class Command(BaseCommand):
    help = 'تنظيف التحليلات المنتهية الصلاحية'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='عرض ما سيتم حذفه دون الحذف الفعلي',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=0,
            help='حذف التحليلات المنتهية الصلاحية منذ X أيام (افتراضي: 0 = فوري)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        extra_days = options['days']
        
        # تحديد التاريخ المرجعي
        cutoff_date = timezone.now() - timedelta(days=extra_days)
        
        # العثور على التحليلات المنتهية الصلاحية
        expired_analyses = UserAnalysisResult.objects.filter(
            expires_at__lt=cutoff_date
        )
        
        total_count = expired_analyses.count()
        
        if total_count == 0:
            self.stdout.write(
                self.style.SUCCESS('لا توجد تحليلات منتهية الصلاحية للحذف')
            )
            return
        
        # عرض إحصائيات
        self.stdout.write(f"عدد التحليلات المنتهية الصلاحية: {total_count}")
        
        # إحصائيات تفصيلية
        by_type = expired_analyses.values('analysis_type').annotate(
            count=models.Count('id')
        )
        
        for item in by_type:
            analysis_type_display = {
                'standard': 'تحليل أسيا',
                'z_format': 'تحليل زين', 
                'comparison': 'مقارنة الملفات'
            }.get(item['analysis_type'], item['analysis_type'])
            
            self.stdout.write(f"  - {analysis_type_display}: {item['count']}")
        
        # عرض أقدم وأحدث تاريخ انتهاء صلاحية
        oldest = expired_analyses.order_by('expires_at').first()
        newest = expired_analyses.order_by('-expires_at').first()
        
        if oldest and newest:
            self.stdout.write(f"النطاق الزمني: {oldest.expires_at.strftime('%Y-%m-%d')} إلى {newest.expires_at.strftime('%Y-%m-%d')}")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('تشغيل تجريبي - لم يتم حذف أي شيء')
            )
            
            # عرض عينة من الملفات التي ستحذف
            sample_files = expired_analyses[:10]
            self.stdout.write("\nعينة من الملفات التي ستحذف:")
            for analysis in sample_files:
                self.stdout.write(
                    f"  - {analysis.display_filename} (المستخدم: {analysis.user.username}, "
                    f"انتهت: {analysis.expires_at.strftime('%Y-%m-%d %H:%M')})"
                )
            
            if total_count > 10:
                self.stdout.write(f"  ... و {total_count - 10} ملف آخر")
                
        else:
            # الحذف الفعلي
            self.stdout.write('بدء عملية الحذف...')
            
            try:
                deleted_count, _ = expired_analyses.delete()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'تم حذف {deleted_count} تحليل منتهي الصلاحية بنجاح'
                    )
                )
                
                # إحصائيات ما بعد الحذف
                remaining_count = UserAnalysisResult.objects.count()
                self.stdout.write(f'عدد التحليلات المتبقية: {remaining_count}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'خطأ أثناء الحذف: {str(e)}')
                )