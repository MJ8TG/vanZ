import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:vanz_mobile/core/constants/colors.dart';
import 'package:vanz_mobile/features/shared/widgets/custom_button.dart';
import 'package:vanz_mobile/features/driver/screens/earnings_screen.dart';

class DriverCompletionScreen extends StatefulWidget {
  const DriverCompletionScreen({Key? key}) : super(key: key);

  @override
  State<DriverCompletionScreen> createState() => _DriverCompletionScreenState();
}

class _DriverCompletionScreenState extends State<DriverCompletionScreen> {
  bool _hasPhoto = false;
  bool _isLoading = false;

  void _takePhoto() {
    setState(() => _isLoading = true);
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _isLoading = false;
        _hasPhoto = true;
      });
    });
  }

  void _completeJob() {
    if (!_hasPhoto) return;
    setState(() => _isLoading = true);
    Future.delayed(const Duration(seconds: 1), () {
      setState(() => _isLoading = false);
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DriverEarningsScreen()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(
          'Finaliser la livraison',
          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Preuve de Livraison Obligatoire',
                style: GoogleFonts.cairo(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Prenez une photo claire du colis déposé devant la porte ou remis au client pour débloquer votre paiement.',
                style: TextStyle(color: AppColors.darkGray, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 32),
              
              // Photo Area Mock
              Expanded(
                child: GestureDetector(
                  onTap: _isLoading ? null : _takePhoto,
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.iceBlue.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: AppColors.teal.withOpacity(0.2),
                        width: 2,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: _hasPhoto
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(28),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                // Mock green gradient representing the captured photo
                                Container(
                                  decoration: const BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [AppColors.teal, AppColors.green],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                ),
                                const Center(
                                  child: Icon(Icons.check_circle_outline, color: AppColors.white, size: 64),
                                ),
                                Positioned(
                                  bottom: 20,
                                  left: 20,
                                  right: 20,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: Colors.black45,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Text(
                                      'Photo enregistrée avec succès',
                                      textAlign: Center,
                                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                )
                              ],
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 72,
                                height: 72,
                                decoration: const BoxDecoration(
                                  color: AppColors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
                                ),
                                child: const Icon(Icons.camera_alt, color: AppColors.teal, size: 36),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Ouvrir l\'appareil photo',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.navy),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Format JPG ou PNG',
                                style: TextStyle(fontSize: 12, color: AppColors.darkGray),
                              )
                            ],
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              CustomButton(
                text: 'Confirmer la livraison',
                isLoading: _isLoading,
                onPressed: _hasPhoto ? _completeJob : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
