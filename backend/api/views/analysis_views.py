# backend/api/views/analysis_views.py - الملف الكامل والمحدث

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from datetime import timedelta
import time
import hashlib
import json
import numpy as np
import pandas as pd

from ..models import UserAnalysisResult
from ..services.standard_analyzer import StandardAnalyzer
from ..services.z_analyzer import ZFormatAnalyzer
from ..services.comparison_analyzer import ComparisonAnalyzer


def generate_file_hash(file_content):
    """إنشاء هاش للملف"""
    return hashlib.sha256(file_content).hexdigest()


def convert_to_json_serializable(obj):
    """تحويل البيانات إلى صيغة قابلة للتسلسل في JSON"""
    if isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif pd.isna(obj):
        return None
    elif isinstance(obj, (pd.Timestamp, pd.DatetimeIndex)):
        return str(obj)
    elif hasattr(obj, 'item'):  # للتعامل مع numpy scalars
        return obj.item()
    elif isinstance(obj, (pd.Series, pd.DataFrame)):
        return obj.to_dict('records') if isinstance(obj, pd.DataFrame) else obj.to_dict()
    else:
        return obj


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel(request):
    """تحليل التنسيق القياسي مع حفظ النتائج"""
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=400)

    file = request.FILES['file']
    start_time = time.time()
    
    try:
        # قراءة محتوى الملف وإنشاء هاش
        file_content = file.read()
        file_hash = generate_file_hash(file_content)
        file.seek(0)  # إعادة تعيين مؤشر الملف للقراءة مرة أخرى
        
        print(f"تحليل ملف: {file.name}, الهاش: {file_hash[:16]}...")
        
        # التحقق من وجود تحليل مطابق تماماً (نفس المحتوى) وغير منتهي الصلاحية
        existing_analysis = UserAnalysisResult.objects.filter(
            user=request.user,
            file_hash=file_hash,
            analysis_type='standard',
            expires_at__gt=timezone.now()
        ).first()
        
        if existing_analysis:
            print(f"تم العثور على تحليل موجود: {existing_analysis.display_filename}")
            
            # إرجاع النتيجة الموجودة مع تحديث وقت الوصول
            existing_analysis.last_accessed = timezone.now()
            existing_analysis.save(update_fields=['last_accessed'])
            
            response_data = existing_analysis.results.copy()
            response_data['is_cached'] = True
            response_data['cached_analysis_info'] = {
                'original_date': existing_analysis.created_at.isoformat(),
                'display_filename': existing_analysis.display_filename,
                'days_until_expiry': existing_analysis.days_until_expiry
            }
            return Response(response_data)
        
        print("إجراء تحليل جديد...")
        
        # إجراء التحليل الجديد
        analyzer = StandardAnalyzer()
        results = analyzer.analyze(file)
        
        processing_time = time.time() - start_time
        print(f"انتهى التحليل في {processing_time:.2f} ثانية")
        
        # تحويل النتائج إلى صيغة قابلة للتسلسل
        serializable_results = convert_to_json_serializable(results)
        
        # حفظ النتائج في قاعدة البيانات
        analysis_result = UserAnalysisResult(
            user=request.user,
            analysis_type='standard',
            original_filename=file.name,
            file_hash=file_hash,
            results=serializable_results,
            sheet_owner_number=serializable_results.get('sheet_owner_number')
        )
        analysis_result.save()  # سيتم إنشاء display_filename تلقائياً
        
        print(f"تم حفظ التحليل باسم: {analysis_result.display_filename}")
        
        # إضافة معلومات إضافية للاستجابة
        response_data = serializable_results.copy()
        response_data['analysis_info'] = {
            'analysis_id': analysis_result.id,
            'display_filename': analysis_result.display_filename,
            'processing_time': round(processing_time, 2),
            'expires_at': analysis_result.expires_at.isoformat(),
            'days_until_expiry': analysis_result.days_until_expiry
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"Error in analyze_excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel_z(request):
    """تحليل تنسيق زين مع حفظ النتائج"""
    if 'main_file' not in request.FILES or 'imei_file' not in request.FILES:
        return Response({"error": "Both main file and IMEI file are required"}, status=400)

    main_file = request.FILES['main_file']
    imei_file = request.FILES['imei_file']
    start_time = time.time()
    
    try:
        # إنشاء هاش مركب للملفين
        main_content = main_file.read()
        imei_content = imei_file.read()
        combined_content = main_content + b"||SEPARATOR||" + imei_content
        file_hash = generate_file_hash(combined_content)
        
        # إعادة تعيين مؤشرات الملفات
        main_file.seek(0)
        imei_file.seek(0)
        
        print(f"تحليل زين - الملف الرئيسي: {main_file.name}, ملف IMEI: {imei_file.name}")
        print(f"الهاش المركب: {file_hash[:16]}...")
        
        # التحقق من وجود تحليل مطابق
        existing_analysis = UserAnalysisResult.objects.filter(
            user=request.user,
            file_hash=file_hash,
            analysis_type='z_format',
            expires_at__gt=timezone.now()
        ).first()
        
        if existing_analysis:
            print(f"تم العثور على تحليل زين موجود: {existing_analysis.display_filename}")
            
            existing_analysis.last_accessed = timezone.now()
            existing_analysis.save(update_fields=['last_accessed'])
            
            response_data = existing_analysis.results.copy()
            response_data['is_cached'] = True
            response_data['cached_analysis_info'] = {
                'original_date': existing_analysis.created_at.isoformat(),
                'display_filename': existing_analysis.display_filename,
                'days_until_expiry': existing_analysis.days_until_expiry
            }
            return Response(response_data)
        
        print("إجراء تحليل زين جديد...")
        
        # إجراء التحليل الجديد
        analyzer = ZFormatAnalyzer()
        results = analyzer.analyze(main_file, imei_file)
        
        processing_time = time.time() - start_time
        print(f"انتهى تحليل زين في {processing_time:.2f} ثانية")
        
        # تحويل النتائج إلى صيغة قابلة للتسلسل
        serializable_results = convert_to_json_serializable(results)
        
        # حفظ النتائج
        analysis_result = UserAnalysisResult(
            user=request.user,
            analysis_type='z_format',
            original_filename=f"{main_file.name} + {imei_file.name}",
            file_hash=file_hash,
            results=serializable_results,
            sheet_owner_number=serializable_results.get('sheet_owner_number')
        )
        analysis_result.save()
        
        print(f"تم حفظ تحليل زين باسم: {analysis_result.display_filename}")
        
        # إضافة معلومات إضافية للاستجابة
        response_data = serializable_results.copy()
        response_data['analysis_info'] = {
            'analysis_id': analysis_result.id,
            'display_filename': analysis_result.display_filename,
            'processing_time': round(processing_time, 2),
            'expires_at': analysis_result.expires_at.isoformat(),
            'days_until_expiry': analysis_result.days_until_expiry
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"Error in analyze_excel_z: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_excel_sheets(request):
    """مقارنة عدة ملفات Excel مع حفظ النتائج"""
    try:
        if not request.FILES:
            return Response({"error": "No files uploaded"}, status=400)
        
        start_time = time.time()
        
        # تجميع الملفات وإنشاء هاش مركب
        files_data = []
        all_content = b""
        
        for key, file in request.FILES.items():
            file_name = request.data.get(f'{key}_name', f'Sheet {len(files_data) + 1}')
            file_format = request.data.get(f'{key}_format', 'standard')
            
            file_content = file.read()
            all_content += file_content + f"||{file_name}||".encode()
            file.seek(0)
            
            files_data.append({
                'file': file,
                'name': file_name,
                'format': file_format
            })
        
        if len(files_data) < 2:
            return Response({"error": "Need at least 2 files for comparison"}, status=400)
        
        # إنشاء هاش للمقارنة
        file_hash = generate_file_hash(all_content)
        combined_filename = " + ".join([f['name'] for f in files_data])
        
        print(f"مقارنة {len(files_data)} ملفات: {combined_filename}")
        print(f"الهاش المركب: {file_hash[:16]}...")
        
        # التحقق من وجود مقارنة مطابقة
        existing_analysis = UserAnalysisResult.objects.filter(
            user=request.user,
            file_hash=file_hash,
            analysis_type='comparison',
            expires_at__gt=timezone.now()
        ).first()
        
        if existing_analysis:
            print(f"تم العثور على مقارنة موجودة: {existing_analysis.display_filename}")
            
            existing_analysis.last_accessed = timezone.now()
            existing_analysis.save(update_fields=['last_accessed'])
            
            response_data = existing_analysis.results.copy()
            response_data['is_cached'] = True
            response_data['cached_analysis_info'] = {
                'original_date': existing_analysis.created_at.isoformat(),
                'display_filename': existing_analysis.display_filename,
                'days_until_expiry': existing_analysis.days_until_expiry
            }
            return Response(response_data)
        
        print("إجراء مقارنة جديدة...")
        
        # إجراء المقارنة الجديدة
        analyzer = ComparisonAnalyzer()
        results = analyzer.analyze_multiple_sheets(files_data)
        
        processing_time = time.time() - start_time
        print(f"انتهت المقارنة في {processing_time:.2f} ثانية")
        
        # تحويل النتائج إلى صيغة قابلة للتسلسل
        serializable_results = convert_to_json_serializable(results)
        
        # حفظ النتائج
        analysis_result = UserAnalysisResult(
            user=request.user,
            analysis_type='comparison',
            original_filename=combined_filename,
            file_hash=file_hash,
            results=serializable_results
        )
        analysis_result.save()
        
        print(f"تم حفظ المقارنة باسم: {analysis_result.display_filename}")
        
        # إضافة معلومات إضافية للاستجابة
        response_data = serializable_results.copy()
        response_data['analysis_info'] = {
            'analysis_id': analysis_result.id,
            'display_filename': analysis_result.display_filename,
            'processing_time': round(processing_time, 2),
            'expires_at': analysis_result.expires_at.isoformat(),
            'days_until_expiry': analysis_result.days_until_expiry
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"Error in compare_excel_sheets: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


# ===== Views جديدة لإدارة النتائج المحفوظة =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_analysis_history(request):
    """الحصول على تاريخ تحليلات المستخدم"""
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        analysis_type = request.GET.get('type')  # تصفية حسب نوع التحليل
        search_term = request.GET.get('search', '').strip()
        
        print(f"طلب تاريخ التحليلات - المستخدم: {request.user.username}, الصفحة: {page}")
        
        # بناء query
        queryset = UserAnalysisResult.objects.filter(
            user=request.user,
            expires_at__gt=timezone.now()  # فقط غير المنتهية الصلاحية
        )
        
        if analysis_type:
            queryset = queryset.filter(analysis_type=analysis_type)
            print(f"تصفية حسب النوع: {analysis_type}")
        
        if search_term:
            queryset = queryset.filter(
                models.Q(display_filename__icontains=search_term) |
                models.Q(sheet_owner_number__icontains=search_term)
            )
            print(f"البحث عن: {search_term}")
        
        # ترتيب حسب التاريخ (الأحدث أولاً)
        queryset = queryset.order_by('-created_at')
        
        # الترقيم
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        
        total_count = queryset.count()
        results = queryset[start_index:end_index]
        
        print(f"تم العثور على {total_count} تحليل, عرض {results.count()} منها")
        
        # تحضير البيانات
        analysis_list = []
        for result in results:
            analysis_list.append({
                'id': result.id,
                'display_filename': result.display_filename,
                'analysis_type': result.get_analysis_type_display(),
                'sheet_owner_number': result.sheet_owner_number,
                'created_at': result.created_at.isoformat(),
                'days_until_expiry': result.days_until_expiry,
                'version_number': result.version_number
            })
        
        return Response({
            'results': analysis_list,
            'total_count': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        })
        
    except Exception as e:
        print(f"Error in get_user_analysis_history: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analysis_result(request, analysis_id):
    """الحصول على نتائج تحليل محدد"""
    try:
        print(f"طلب تحليل رقم: {analysis_id} من المستخدم: {request.user.username}")
        
        analysis = UserAnalysisResult.objects.get(
            id=analysis_id,
            user=request.user,
            expires_at__gt=timezone.now()
        )
        
        # تحديث وقت الوصول
        analysis.last_accessed = timezone.now()
        analysis.save(update_fields=['last_accessed'])
        
        print(f"تم العثور على التحليل: {analysis.display_filename}")
        
        # إرجاع النتائج مع معلومات إضافية
        response_data = analysis.results.copy()
        response_data['analysis_info'] = {
            'analysis_id': analysis.id,
            'display_filename': analysis.display_filename,
            'original_filename': analysis.original_filename,
            'analysis_type': analysis.get_analysis_type_display(),
            'created_at': analysis.created_at.isoformat(),
            'days_until_expiry': analysis.days_until_expiry,
            'version_number': analysis.version_number,
            'sheet_owner_number': analysis.sheet_owner_number
        }
        
        return Response(response_data)
        
    except UserAnalysisResult.DoesNotExist:
        print(f"التحليل {analysis_id} غير موجود أو منتهي الصلاحية")
        return Response({"error": "Analysis not found or expired"}, status=404)
    except Exception as e:
        print(f"Error in get_analysis_result: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_analysis_result(request, analysis_id):
    """حذف نتيجة تحليل"""
    try:
        print(f"طلب حذف التحليل رقم: {analysis_id} من المستخدم: {request.user.username}")
        
        analysis = UserAnalysisResult.objects.get(
            id=analysis_id,
            user=request.user
        )
        
        filename = analysis.display_filename
        analysis.delete()
        
        print(f"تم حذف التحليل: {filename}")
        
        return Response({
            "message": f"تم حذف التحليل '{filename}' بنجاح"
        })
        
    except UserAnalysisResult.DoesNotExist:
        print(f"التحليل {analysis_id} غير موجود")
        return Response({"error": "Analysis not found"}, status=404)
    except Exception as e:
        print(f"Error in delete_analysis_result: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


# ===== إحصائيات التحليلات =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analysis_statistics(request):
    """الحصول على إحصائيات تحليلات المستخدم"""
    try:
        user_analyses = UserAnalysisResult.objects.filter(user=request.user)
        
        # إحصائيات عامة
        total_analyses = user_analyses.count()
        active_analyses = user_analyses.filter(expires_at__gt=timezone.now()).count()
        expired_analyses = user_analyses.filter(expires_at__lte=timezone.now()).count()
        
        # إحصائيات حسب النوع
        by_type = user_analyses.values('analysis_type').annotate(
            count=models.Count('id')
        )
        
        # إحصائيات انتهاء الصلاحية
        expires_soon = user_analyses.filter(
            expires_at__gt=timezone.now(),
            expires_at__lte=timezone.now() + timedelta(days=7)
        ).count()
        
        return Response({
            'total_analyses': total_analyses,
            'active_analyses': active_analyses,
            'expired_analyses': expired_analyses,
            'expires_soon': expires_soon,
            'by_type': list(by_type)
        })
        
    except Exception as e:
        print(f"Error in get_analysis_statistics: {str(e)}")
        return Response({"error": str(e)}, status=500)