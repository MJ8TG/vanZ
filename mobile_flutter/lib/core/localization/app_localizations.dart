import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('fr'));
  }

  static const _localizedValues = {
    'fr': {
      'app_title': 'VanZ',
      'welcome_subtitle': 'Votre transporteur en un clic',
      'phone_hint': 'Téléphone (+216)',
      'otp_title': 'Code de vérification',
      'otp_subtitle': 'Saisissez le code envoyé par SMS',
      'continue': 'Continuer',
      'request_trip': 'Commander un Van',
      'searching_driver': 'Recherche d\'un chauffeur à proximité...',
      'cancel': 'Annuler',
      'trip_completed': 'Course Terminée',
      'rate_driver': 'Évaluer le chauffeur',
      'earnings': 'Mes Gains',
      'online': 'EN LIGNE',
      'offline': 'HORS LIGNE',
      'waiting_trip': 'En attente d\'une course...',
      'incoming_trip': 'Nouvelle course reçue',
      'arrived': 'Arrivé',
      'start_trip': 'Démarrer la course',
      'complete_trip': 'Clôturer la course',
      'confirm_dropoff': 'Confirmer la livraison',
    },
    'ar': {
      'app_title': 'فان زاد',
      'welcome_subtitle': 'شاحنتك بنقرة واحدة',
      'phone_hint': 'الهاتف (216+)',
      'otp_title': 'رمز التحقق',
      'otp_subtitle': 'أدخل الرمز المرسل عبر رسالة قصيرة',
      'continue': 'متابعة',
      'request_trip': 'طلب شاحنة',
      'searching_driver': 'البحث عن سائق قريب...',
      'cancel': 'إلغاء',
      'trip_completed': 'اكتملت الرحلة',
      'rate_driver': 'تقييم السائق',
      'earnings': 'أرباحي',
      'online': 'مباشر',
      'offline': 'غير متصل',
      'waiting_trip': 'في انتظار طلب رحلة...',
      'incoming_trip': 'طلب رحلة جديد',
      'arrived': 'وصلت',
      'start_trip': 'بدء الرحلة',
      'complete_trip': 'إنهاء الرحلة',
      'confirm_dropoff': 'تأكيد التسليم',
    }
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }

  bool get isRtl => locale.languageCode == 'ar';
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['fr', 'ar'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(LocalizationsDelegate<AppLocalizations> old) => false;
}
