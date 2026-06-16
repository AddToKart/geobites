import 'package:dio/dio.dart';
import '../core/api_client.dart';

class UploadService {
  Future<String> uploadImage(String filePath) async {
    try {
      final fileName = filePath.split('/').last;
      
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
      });

      final response = await apiClient.dio.post(
        '/upload',
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );

      return response.data['url'] as String;
    } catch (e) {
      throw Exception('Failed to upload image: $e');
    }
  }

  Future<String> uploadImageBytes(List<int> bytes, String fileName) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: fileName),
      });

      final response = await apiClient.dio.post(
        '/upload',
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
      );

      return response.data['url'] as String;
    } catch (e) {
      throw Exception('Failed to upload image bytes: $e');
    }
  }
}

final uploadService = UploadService();
