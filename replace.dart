import 'dart:io';

void main() {
  final dir = Directory('flutter_geobite/lib/screens');
  final files = dir.listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'));
  
  int updated = 0;
  for (var file in files) {
    String content = file.readAsStringSync();
    if (!content.contains('ScaffoldMessenger.of(context).showSnackBar')) continue;
    
    // Add import
    if (!content.contains("import '../../widgets/glass_toast.dart';")) {
      // Find the last import
      final importIndex = content.lastIndexOf('import ');
      if (importIndex != -1) {
        final endOfLine = content.indexOf('\n', importIndex);
        content = content.substring(0, endOfLine + 1) + "import '../../widgets/glass_toast.dart';\n" + content.substring(endOfLine + 1);
      } else {
        content = "import '../../widgets/glass_toast.dart';\n" + content;
      }
    }
    
    // Replace ScaffoldMessenger patterns
    content = content.replaceAllMapped(
      RegExp(r"ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*const\s*SnackBar\(content:\s*Text\('([^']+)'\)\)\s*\);"),
      (match) {
        final text = match.group(1)!;
        if (text.toLowerCase().contains('fail') || text.toLowerCase().contains('error') || text.toLowerCase().contains('denied')) {
          return "GlassToast.error(context, '$text');";
        } else if (text.toLowerCase().contains('success') || text.toLowerCase().contains('saved') || text.toLowerCase().contains('updated')) {
          return "GlassToast.success(context, '$text');";
        } else {
          return "GlassToast.info(context, '$text');";
        }
      }
    );
    
    content = content.replaceAllMapped(
      RegExp(r"ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*SnackBar\(content:\s*Text\('([^']+)'\)\)\s*\);"),
      (match) {
        final text = match.group(1)!;
        if (text.toLowerCase().contains('fail') || text.toLowerCase().contains('error') || text.toLowerCase().contains('denied')) {
          return "GlassToast.error(context, '$text');";
        } else if (text.toLowerCase().contains('success') || text.toLowerCase().contains('saved') || text.toLowerCase().contains('updated')) {
          return "GlassToast.success(context, '$text');";
        } else {
          return "GlassToast.info(context, '$text');";
        }
      }
    );

    // Dynamic text with $ variables
    content = content.replaceAllMapped(
      RegExp(r"ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*SnackBar\(content:\s*Text\(([^)]+)\)\)\s*\);"),
      (match) {
        final text = match.group(1)!;
        if (text.toLowerCase().contains('fail') || text.toLowerCase().contains('error')) {
          return "GlassToast.error(context, $text);";
        } else {
          return "GlassToast.info(context, $text);";
        }
      }
    );
    
    // Multiline variants
    content = content.replaceAllMapped(
      RegExp(r"ScaffoldMessenger\.of\(context\)\.showSnackBar\([\s\S]*?SnackBar\([\s\S]*?content:\s*Text\('([^']+)'\)[\s\S]*?\)\s*\);"),
      (match) {
        final text = match.group(1)!;
        return "GlassToast.info(context, '$text');";
      }
    );

    file.writeAsStringSync(content);
    updated++;
  }
  
  print('Updated $updated files with GlassToast.');
}
