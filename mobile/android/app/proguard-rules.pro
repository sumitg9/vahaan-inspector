# VahanCheck Enterprise — Android ProGuard / R8 Obfuscation Rules
# Protects encrypted SQLite (SQLCipher), JSON serialization & reflection

# 1. SQLCipher AES-256 Encrypted SQLite
-keep class net.sqlcipher.** { *; }
-keep interface net.sqlcipher.** { *; }
-keep class com.commonsware.cwac.saferoom.** { *; }
-dontwarn net.sqlcipher.**

# 2. Flutter and Dart Engine Primitives
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# 3. JSON Model Serialization & Deserialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# 4. Suppress warnings on third-party libraries
-dontwarn okio.**
-dontwarn javax.annotation.**
