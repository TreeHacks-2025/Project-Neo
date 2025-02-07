import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neo_flutter/main.dart';

void main() async {
  // Ensure Flutter framework is initialized before calling `availableCameras`
  WidgetsFlutterBinding.ensureInitialized();

  // Retrieve available cameras
  final cameras = await availableCameras();
  final firstCamera = cameras.isNotEmpty ? cameras.first : null;

  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Ensure a valid camera is available
    if (firstCamera == null) {
      fail("No available cameras for testing.");
    }

    // Pass the camera to MyApp
    await tester.pumpWidget(MyApp(camera: firstCamera));

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
