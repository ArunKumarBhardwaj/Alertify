const { withAndroidManifest } = require('expo/config-plugins');

const REMOVED_PERMISSIONS = [
  'android.permission.QUERY_ALL_PACKAGES',
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
];

/**
 * Ensures launcher apps are visible (Android 11+ package visibility) and
 * strips permissions that trigger Play Protect install warnings.
 */
function withAndroidAppVisibility(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest.$) {
      manifest.manifest.$ = {};
    }
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!manifest.manifest.queries) {
      manifest.manifest.queries = [];
    }

    const queries = manifest.manifest.queries;
    const hasLauncherQuery = queries.some((query) => {
      const intents = query.intent ?? [];
      return intents.some((intent) => {
        const actions = intent.action ?? [];
        const categories = intent.category ?? [];
        return (
          actions.some((a) => a.$?.['android:name'] === 'android.intent.action.MAIN') &&
          categories.some((c) => c.$?.['android:name'] === 'android.intent.category.LAUNCHER')
        );
      });
    });

    if (!hasLauncherQuery) {
      queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      });
    }

    const permissions = manifest.manifest['uses-permission'] ?? [];

    const filteredPermissions = permissions.filter((perm) => {
      const name = perm.$?.['android:name'];
      return !REMOVED_PERMISSIONS.includes(name);
    });

    for (const permission of REMOVED_PERMISSIONS) {
      const alreadyRemoving = filteredPermissions.some(
        (perm) =>
          perm.$?.['android:name'] === permission && perm.$?.['tools:node'] === 'remove'
      );
      if (!alreadyRemoving) {
        filteredPermissions.push({
          $: {
            'android:name': permission,
            'tools:node': 'remove',
          },
        });
      }
    }

    manifest.manifest['uses-permission'] = filteredPermissions;

    return config;
  });
}

module.exports = withAndroidAppVisibility;
