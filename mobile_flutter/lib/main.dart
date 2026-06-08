import 'package:flutter/material.dart';
import 'package:vanz_mobile/core/theme/app_theme.dart';
import 'package:vanz_mobile/core/localization/app_localizations.dart';
import 'package:vanz_mobile/features/splash/screens/splash_screen.dart';

void main() {
  runApp(const VanZApp());
}

class VanZApp extends StatelessWidget {
  const VanZApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VanZ',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      localizationsDelegates: const [
        AppLocalizationsDelegate(),
      ],
      supportedLocales: const [
        Locale('fr'),
        Locale('ar'),
      ],
      locale: const Locale('fr'), // Default locale set to French
      home: const SplashScreen(),
    );
  }
}
