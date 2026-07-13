// Firebase configuration for the Red Rebels apps.
//
// Hand-generated from android/app/google-services.json and
// ios/Runner/GoogleService-Info.plist (what `flutterfire configure` would
// emit). These are public client identifiers, not secrets — abuse is
// prevented by package/bundle binding and server-side rules.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform => switch (defaultTargetPlatform) {
        TargetPlatform.android => android,
        TargetPlatform.iOS => ios,
        _ => throw UnsupportedError(
            'DefaultFirebaseOptions are only configured for Android and iOS.',
          ),
      };

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDTNRaFckomYJXDZH9eeY11l7Wl108XmPw',
    appId: '1:658056361557:android:2e1972e6b8f4b0327386dc',
    messagingSenderId: '658056361557',
    projectId: 'red-rebels-calendar',
    storageBucket: 'red-rebels-calendar.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBhgcJZccMegnquUAndfbyxkV4euJ0LyZo',
    appId: '1:658056361557:ios:fc7cb6e9588fdd2e7386dc',
    messagingSenderId: '658056361557',
    projectId: 'red-rebels-calendar',
    storageBucket: 'red-rebels-calendar.firebasestorage.app',
    iosBundleId: 'com.redrebels.redRebelsCalendar',
  );
}
