/**
 * Unit tests for environment control tool schemas
 */

import { describe, test, expect } from 'vitest';
import {
  StatusBarOverrideSchema,
  StatusBarListSchema,
  StatusBarClearSchema,
  SetAppearanceSchema,
  GetAppearanceSchema,
  SetContentSizeSchema,
  GetContentSizeSchema,
  SetIncreaseContrastSchema,
  GrantPermissionSchema,
  RevokePermissionSchema,
  ResetPermissionsSchema,
  SendPushNotificationSchema
} from '../../src/schemas/environment.js';

describe('StatusBarOverrideSchema', () => {
  test('accepts valid override with all parameters', () => {
    const input = {
      device: 'booted',
      time: '9:41',
      dataNetwork: 'wifi',
      wifiMode: 'active',
      wifiBars: 3,
      cellularMode: 'active',
      cellularBars: 4,
      operatorName: 'Carrier',
      batteryState: 'charged',
      batteryLevel: 100
    };

    const result = StatusBarOverrideSchema.parse(input);

    expect(result.device).toBe('booted');
    expect(result.time).toBe('9:41');
    expect(result.dataNetwork).toBe('wifi');
    expect(result.wifiMode).toBe('active');
    expect(result.wifiBars).toBe(3);
    expect(result.cellularMode).toBe('active');
    expect(result.cellularBars).toBe(4);
    expect(result.operatorName).toBe('Carrier');
    expect(result.batteryState).toBe('charged');
    expect(result.batteryLevel).toBe(100);
  });

  test('accepts empty object with defaults', () => {
    const input = {};

    const result = StatusBarOverrideSchema.parse(input);

    expect(result.device).toBe('booted');
  });

  test('accepts partial overrides', () => {
    const input = {
      time: '9:41',
      batteryLevel: 100
    };

    const result = StatusBarOverrideSchema.parse(input);

    expect(result.time).toBe('9:41');
    expect(result.batteryLevel).toBe(100);
    expect(result.device).toBe('booted');
  });

  test('validates data network enum values', () => {
    const validNetworks = ['hide', 'wifi', '3g', '4g', 'lte', 'lte-a', 'lte+', '5g', '5g+', '5g-uwb', '5g-uc'];

    validNetworks.forEach(network => {
      const result = StatusBarOverrideSchema.parse({ dataNetwork: network });
      expect(result.dataNetwork).toBe(network);
    });
  });

  test('rejects invalid data network value', () => {
    expect(() => StatusBarOverrideSchema.parse({ dataNetwork: 'invalid' })).toThrow();
  });

  test('validates wifi bars range', () => {
    expect(() => StatusBarOverrideSchema.parse({ wifiBars: -1 })).toThrow();
    expect(() => StatusBarOverrideSchema.parse({ wifiBars: 4 })).toThrow();

    const result = StatusBarOverrideSchema.parse({ wifiBars: 2 });
    expect(result.wifiBars).toBe(2);
  });

  test('validates cellular bars range', () => {
    expect(() => StatusBarOverrideSchema.parse({ cellularBars: -1 })).toThrow();
    expect(() => StatusBarOverrideSchema.parse({ cellularBars: 5 })).toThrow();

    const result = StatusBarOverrideSchema.parse({ cellularBars: 3 });
    expect(result.cellularBars).toBe(3);
  });

  test('validates battery level range', () => {
    expect(() => StatusBarOverrideSchema.parse({ batteryLevel: -1 })).toThrow();
    expect(() => StatusBarOverrideSchema.parse({ batteryLevel: 101 })).toThrow();

    const result = StatusBarOverrideSchema.parse({ batteryLevel: 50 });
    expect(result.batteryLevel).toBe(50);
  });

  test('validates battery state enum', () => {
    ['charging', 'charged', 'discharging'].forEach(state => {
      const result = StatusBarOverrideSchema.parse({ batteryState: state });
      expect(result.batteryState).toBe(state);
    });

    expect(() => StatusBarOverrideSchema.parse({ batteryState: 'invalid' })).toThrow();
  });
});

describe('StatusBarListSchema', () => {
  test('accepts device parameter', () => {
    const result = StatusBarListSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = StatusBarListSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('StatusBarClearSchema', () => {
  test('accepts device parameter', () => {
    const result = StatusBarClearSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = StatusBarClearSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('SetAppearanceSchema', () => {
  test('accepts light mode', () => {
    const result = SetAppearanceSchema.parse({ mode: 'light' });
    expect(result.mode).toBe('light');
    expect(result.device).toBe('booted');
  });

  test('accepts dark mode', () => {
    const result = SetAppearanceSchema.parse({ mode: 'dark' });
    expect(result.mode).toBe('dark');
  });

  test('rejects invalid mode', () => {
    expect(() => SetAppearanceSchema.parse({ mode: 'invalid' })).toThrow();
  });

  test('requires mode parameter', () => {
    expect(() => SetAppearanceSchema.parse({})).toThrow();
  });

  test('accepts custom device', () => {
    const result = SetAppearanceSchema.parse({ device: 'ABC123', mode: 'dark' });
    expect(result.device).toBe('ABC123');
  });
});

describe('GetAppearanceSchema', () => {
  test('accepts device parameter', () => {
    const result = GetAppearanceSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = GetAppearanceSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('SetContentSizeSchema', () => {
  test('accepts all standard sizes', () => {
    const standardSizes = [
      'extra-small',
      'small',
      'medium',
      'large',
      'extra-large',
      'extra-extra-large',
      'extra-extra-extra-large'
    ];

    standardSizes.forEach(size => {
      const result = SetContentSizeSchema.parse({ size });
      expect(result.size).toBe(size);
    });
  });

  test('accepts all accessibility sizes', () => {
    const accessibilitySizes = [
      'accessibility-medium',
      'accessibility-large',
      'accessibility-extra-large',
      'accessibility-extra-extra-large',
      'accessibility-extra-extra-extra-large'
    ];

    accessibilitySizes.forEach(size => {
      const result = SetContentSizeSchema.parse({ size });
      expect(result.size).toBe(size);
    });
  });

  test('rejects invalid size', () => {
    expect(() => SetContentSizeSchema.parse({ size: 'invalid' })).toThrow();
  });

  test('requires size parameter', () => {
    expect(() => SetContentSizeSchema.parse({})).toThrow();
  });

  test('accepts custom device', () => {
    const result = SetContentSizeSchema.parse({ device: 'ABC123', size: 'large' });
    expect(result.device).toBe('ABC123');
  });
});

describe('GetContentSizeSchema', () => {
  test('accepts device parameter', () => {
    const result = GetContentSizeSchema.parse({ device: 'ABC123' });
    expect(result.device).toBe('ABC123');
  });

  test('defaults to booted', () => {
    const result = GetContentSizeSchema.parse({});
    expect(result.device).toBe('booted');
  });
});

describe('SetIncreaseContrastSchema', () => {
  test('accepts enabled true', () => {
    const result = SetIncreaseContrastSchema.parse({ enabled: true });
    expect(result.enabled).toBe(true);
    expect(result.device).toBe('booted');
  });

  test('accepts enabled false', () => {
    const result = SetIncreaseContrastSchema.parse({ enabled: false });
    expect(result.enabled).toBe(false);
  });

  test('requires enabled parameter', () => {
    expect(() => SetIncreaseContrastSchema.parse({})).toThrow();
  });

  test('rejects non-boolean enabled', () => {
    expect(() => SetIncreaseContrastSchema.parse({ enabled: 'yes' })).toThrow();
  });

  test('accepts custom device', () => {
    const result = SetIncreaseContrastSchema.parse({ device: 'ABC123', enabled: true });
    expect(result.device).toBe('ABC123');
  });
});
describe('GrantPermissionSchema', () => {
  test('accepts valid permission grant', () => {
    const result = GrantPermissionSchema.parse({
      bundleId: 'com.example.app',
      service: 'location'
    });

    expect(result.bundleId).toBe('com.example.app');
    expect(result.service).toBe('location');
    expect(result.device).toBe('booted');
  });

  test('accepts all permission services', () => {
    const services = [
      'all', 'calendar', 'contacts-limited', 'contacts',
      'location', 'location-always', 'photos-add', 'photos',
      'media-library', 'microphone', 'motion', 'reminders', 'siri'
    ];

    services.forEach(service => {
      const result = GrantPermissionSchema.parse({
        bundleId: 'com.example.app',
        service
      });
      expect(result.service).toBe(service);
    });
  });

  test('requires bundleId', () => {
    expect(() => GrantPermissionSchema.parse({ service: 'location' })).toThrow();
  });

  test('requires service', () => {
    expect(() => GrantPermissionSchema.parse({ bundleId: 'com.example.app' })).toThrow();
  });

  test('rejects invalid service', () => {
    expect(() => GrantPermissionSchema.parse({
      bundleId: 'com.example.app',
      service: 'invalid'
    })).toThrow();
  });
});

describe('RevokePermissionSchema', () => {
  test('accepts valid permission revoke', () => {
    const result = RevokePermissionSchema.parse({
      bundleId: 'com.example.app',
      service: 'photos'
    });

    expect(result.bundleId).toBe('com.example.app');
    expect(result.service).toBe('photos');
  });

  test('requires both bundleId and service', () => {
    expect(() => RevokePermissionSchema.parse({ bundleId: 'com.example.app' })).toThrow();
    expect(() => RevokePermissionSchema.parse({ service: 'location' })).toThrow();
  });
});

describe('ResetPermissionsSchema', () => {
  test('accepts reset all permissions for all apps', () => {
    const result = ResetPermissionsSchema.parse({});

    expect(result.device).toBe('booted');
    expect(result.bundleId).toBeUndefined();
    expect(result.service).toBeUndefined();
  });

  test('accepts reset specific app', () => {
    const result = ResetPermissionsSchema.parse({
      bundleId: 'com.example.app'
    });

    expect(result.bundleId).toBe('com.example.app');
  });

  test('accepts reset specific service', () => {
    const result = ResetPermissionsSchema.parse({
      service: 'location'
    });

    expect(result.service).toBe('location');
  });

  test('accepts reset specific service for specific app', () => {
    const result = ResetPermissionsSchema.parse({
      bundleId: 'com.example.app',
      service: 'location'
    });

    expect(result.bundleId).toBe('com.example.app');
    expect(result.service).toBe('location');
  });
});

describe('SendPushNotificationSchema', () => {
  test('accepts valid push notification', () => {
    const result = SendPushNotificationSchema.parse({
      bundleId: 'com.example.app',
      payload: {
        aps: {
          alert: 'Test message'
        }
      }
    });

    expect(result.bundleId).toBe('com.example.app');
    expect(result.payload.aps).toBeDefined();
    expect(result.device).toBe('booted');
  });

  test('accepts complex payload', () => {
    const result = SendPushNotificationSchema.parse({
      bundleId: 'com.example.app',
      payload: {
        aps: {
          alert: {
            title: 'Test',
            body: 'Message'
          },
          badge: 1,
          sound: 'default'
        },
        customData: {
          key: 'value'
        }
      }
    });

    expect(result.payload.aps.alert).toBeDefined();
    expect(result.payload.aps.badge).toBe(1);
    expect(result.payload.customData).toBeDefined();
  });

  test('requires bundleId', () => {
    expect(() => SendPushNotificationSchema.parse({
      payload: { aps: {} }
    })).toThrow();
  });

  test('requires payload', () => {
    expect(() => SendPushNotificationSchema.parse({
      bundleId: 'com.example.app'
    })).toThrow();
  });

  test('accepts custom device', () => {
    const result = SendPushNotificationSchema.parse({
      device: 'ABC123',
      bundleId: 'com.example.app',
      payload: { aps: {} }
    });

    expect(result.device).toBe('ABC123');
  });
});
