import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('geobites.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    // Initialize FFI if on Windows/Linux desktop
    if (!kIsWeb && (Platform.isWindows || Platform.isLinux)) {
      sqfliteFfiInit();
      databaseFactory = databaseFactoryFfi;
    }

    final dbPath = await getApplicationDocumentsDirectory();
    final path = join(dbPath.path, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      const idType = 'TEXT PRIMARY KEY';
      const textType = 'TEXT';
      await db.execute('''
CREATE TABLE offline_queue (
  id $idType,
  actionType $textType,
  payload $textType,
  timestamp $textType
)
''');
    }
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT';
    const realType = 'REAL';

    // Orders Table
    await db.execute('''
CREATE TABLE orders (
  id $idType,
  customerId $textType,
  vendorId $textType,
  riderId $textType,
  status $textType,
  totalAmount $realType,
  deliveryAddress $textType,
  deliveryLat $realType,
  deliveryLng $realType,
  paymentMethod $textType,
  notes $textType,
  createdAt $textType,
  updatedAt $textType,
  vendorJson $textType,
  itemsJson $textType
)
''');

    // Offline Queue Table
    await db.execute('''
CREATE TABLE offline_queue (
  id $idType,
  actionType $textType,
  payload $textType,
  timestamp $textType
)
''');
  }

  // --- CRUD Operations ---

  Future<void> upsertOrder(Map<String, dynamic> orderData) async {
    if (kIsWeb) return;
    final db = await instance.database;
    await db.insert('orders', orderData, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getAllOrders() async {
    if (kIsWeb) return [];
    final db = await instance.database;
    return await db.query('orders', orderBy: 'createdAt DESC');
  }

  Future<void> clearAll() async {
    if (kIsWeb) return;
    final db = await instance.database;
    await db.delete('orders');
    await db.delete('offline_queue');
  }

  // --- Offline Queue Operations ---

  Future<void> enqueueAction(String actionType, String payload) async {
    if (kIsWeb) return;
    final db = await instance.database;
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    await db.insert('offline_queue', {
      'id': id,
      'actionType': actionType,
      'payload': payload,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getPendingActions() async {
    if (kIsWeb) return [];
    final db = await instance.database;
    return await db.query('offline_queue', orderBy: 'timestamp ASC');
  }

  Future<void> removeAction(String id) async {
    if (kIsWeb) return;
    final db = await instance.database;
    await db.delete('offline_queue', where: 'id = ?', whereArgs: [id]);
  }
}
