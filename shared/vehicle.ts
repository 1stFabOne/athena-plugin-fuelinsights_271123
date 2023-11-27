// Consum/Growth:
export const VEHICLE_STATE = {
    LOCK: `Vehicle-Lock`,
    KEYS: `Vehicle-Keys`,
    OWNER: 'Vehicle-Owner',
    ENGINE: 'Vehicle-Engine',
    ENGINE_HEALTH: 'Vehicle-Engine-Health',
    MASS: 'Vehicle-Mass',
    CLASS: 'Vehicle-Class',
    FUEL: 'Vehicle-Fuel',
    OIL: 'Vehicle-Oil',
    TIME: '00:00',
    MILEAGE: 'Vehicle-Mileage',
    POSITION: 'Vehicle-Position',
    LOCKSYMBOL: 'Vehicle-Locksymbol',
    LOCK_INTERACTION_INFO: 'Vehicle-LockInteractionInfo',
};
// Consum/Growth:
export enum Vehicle_Behavior {
    CONSUMES_FUEL = 1,
    CONSUMES_OIL = 1,
    GROWTH_MILEAGE = 0.1,
    UNLIMITED_PETROL = 2,
    NEED_KEY_TO_START = 4,
    NO_KEY_TO_START = 8,
    NO_KEY_TO_LOCK = 16,
    NO_SAVE = 32,
};
// Consum/Growth:
export const enum VEHICLE_RULES {
    ENTER = 'vehicle-enter',
    EXIT = 'vehicle-exit',
    LOCK = 'vehicle-lock',
    UNLOCK = 'vehicle-unlock',
    STORAGE = 'vehicle-storage',
    ENGINE = 'vehicle-engine',
    DOOR = 'vehicle-door',
}
// Gasstation:
export enum VIEW_EVENTS_FUEL_TRIGGER {
    OPEN = 'fuelTrigger:Open',
    CANCEL = 'fuelTrigger:Cancel',
    ACCEPT = 'fuelTrigger:Accept',
}
