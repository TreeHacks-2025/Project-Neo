import 'package:flutter/material.dart';
import 'pages/home_page.dart'; // Import home_page.dart correctly

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const HomePage(), // Use HomePage from home_page.dart
    );
  }
}
