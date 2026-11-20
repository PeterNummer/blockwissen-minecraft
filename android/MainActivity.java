package de.blockwissen.minecraft;

import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {
    private static final String RELEASE_API =
        "https://api.github.com/repos/PeterNummer/blockwissen-minecraft/releases/latest";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        checkForUpdates();
    }

    private void checkForUpdates() {
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(RELEASE_API).openConnection();
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "Blockwissen-Minecraft-Android");
                connection.setConnectTimeout(7000);
                connection.setReadTimeout(7000);

                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) response.append(line);
                reader.close();

                JSONObject release = new JSONObject(response.toString());
                String latest = release.optString("tag_name", "").replaceFirst("^[vV]", "");
                String current = getPackageManager()
                    .getPackageInfo(getPackageName(), 0).versionName;
                JSONArray assets = release.optJSONArray("assets");
                String apkUrl = null;

                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.getJSONObject(i);
                        if ("Blockwissen-Minecraft-Android.apk".equals(asset.optString("name"))) {
                            apkUrl = asset.optString("browser_download_url");
                            break;
                        }
                    }
                }

                if (apkUrl != null && isNewer(latest, current)) {
                    final String downloadUrl = apkUrl;
                    runOnUiThread(() -> new AlertDialog.Builder(this)
                        .setTitle("Update verfügbar")
                        .setMessage("Version " + latest + " ist verfügbar. Möchtest du das Update herunterladen?")
                        .setNegativeButton("Später", (dialog, which) -> dialog.dismiss())
                        .setPositiveButton("Herunterladen", (dialog, which) -> {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl));
                            startActivity(intent);
                        })
                        .show());
                }
            } catch (Exception error) {
                Log.d("BlockwissenUpdate", "Update-Prüfung nicht möglich: " + error.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    private boolean isNewer(String latest, String current) {
        try {
            String[] a = latest.split("\\.");
            String[] b = current.split("\\.");
            for (int i = 0; i < Math.max(a.length, b.length); i++) {
                int x = i < a.length ? Integer.parseInt(a[i].replaceAll("[^0-9].*$", "")) : 0;
                int y = i < b.length ? Integer.parseInt(b[i].replaceAll("[^0-9].*$", "")) : 0;
                if (x != y) return x > y;
            }
        } catch (Exception ignored) { }
        return false;
    }
}
