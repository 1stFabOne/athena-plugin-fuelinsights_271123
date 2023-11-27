import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api/index.js';
import path from 'path';
import * as fs from 'fs';
import { VEHICLE_STATE } from '../../shared/vehicle.js';
import { distance2d } from '@AthenaPlugins/gp-athena-utils/shared/utility/vector.js';
import { ATHENA_EVENTS_VEHICLE, HANDLE_CONFIG, HANDLE_NAME } from './config.js';
import { toggleEngine } from '@AthenaServer/vehicle/controls.js';
import { LOCALE_HANDLE } from '../../shared/locales.js';
import { IBaseVehicle } from '../../shared/interfaces/ibasevehicle.js';
import { NotifyController } from '@AthenaPlugins/athena-plugin-notifications/server/controller.js';

// TODO:  Fueltype/Fueltank nachbearbeiten

export class System {
    static init() {
        alt.setInterval(System.updateDrivingPlayers, HANDLE_CONFIG.TICK_TIME);

        Athena.vehicle.events.on('engine-started', (vehicle: alt.Vehicle, ) => {
            let vehicleData = Athena.document.vehicle.get<IBaseVehicle>(vehicle);
            if (!vehicleData) {
                return { status: true, response: '' };
            }
            if (!vehicle.engineOn && !System.hasDefaults(vehicle, vehicleData)) {
                return { status: false, response: LOCALE_HANDLE.VEH_SERVICE };
            }
            if (vehicle['isRefueling']) {
                return { status: false, response: LOCALE_HANDLE.VEH_REFUEL };
            }
            return { status: true, response: '' };
        });
    }

    //  -------------------------------------- Player Check -------------------------------------

    static updateDrivingPlayers() {
        const vehicles = [...alt.Vehicle.all];
        for (const vehicle of vehicles) {
            if (vehicle && vehicle.engineOn) {
                let vehicleData = Athena.document.vehicle.get<IBaseVehicle>(vehicle);
                System.tick(vehicle, vehicleData);
            }
        }
    }

    //  ----------------------------------- Vehicle Value Check ---------------------------------

    static hasDefaults(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        if (!vehicleData) {
            return true;
        }
        vehicleData.state.fuel ??= HANDLE_CONFIG.FUEL_CREATE;
        vehicleData.state.mileage ??= HANDLE_CONFIG.MILEAGE_CREATE;
        vehicleData.state.oil ??= HANDLE_CONFIG.OIL_CREATE;
        vehicleData.state.engineHealth ??= HANDLE_CONFIG.ENGINE_HEALTH_CREATE;
        System.addDebugText_hasDefaults(vehicle, vehicleData);
        return (
            vehicleData.state.fuel > HANDLE_CONFIG.EMPTY &&
            vehicleData.state.oil > HANDLE_CONFIG.EMPTY &&
            vehicleData.state.engineHealth > HANDLE_CONFIG.EMPTY &&
            vehicleData.state.mileage < HANDLE_CONFIG.MAX_MILEAGE
            );
    }

    //  ---------------------------------------- Tick -------------------------------------------

    static tick(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        if (!vehicle?.valid) {
            return;
        }
        if (!vehicleData) {
            System.setVehicleDefaults(vehicle, vehicleData);
            return;
        }
        vehicleData.state.fuel = vehicleData.state.fuel ?? HANDLE_CONFIG.FUEL_CREATE;
        vehicleData.state.mileage ??= HANDLE_CONFIG.MILEAGE_CREATE;
        vehicleData.state.oil ??= HANDLE_CONFIG.OIL_CREATE;
        vehicleData.state.engineHealth ??= HANDLE_CONFIG.ENGINE_HEALTH_CREATE;
        System.addDebugText_TickStart(vehicle, vehicleData);
        if (!vehicle.lastPosition) {
            vehicle.lastPosition = vehicle.pos;
        }
        const dist = distance2d(vehicle.pos, vehicle.lastPosition);
        if (dist >= 5) {
            Athena.events.vehicle.trigger(ATHENA_EVENTS_VEHICLE.DISTANCE_TRAVELED, vehicle, dist);
            vehicle.lastPosition = vehicle.pos;
            //  minus fuel & plus mileage
            vehicleData.state.mileage = vehicleData.state.mileage + HANDLE_CONFIG.MILEAGE_GROWTH;
            vehicleData.state.fuel = vehicleData.state.fuel - HANDLE_CONFIG.FUEL_LOST;
        }
        if (!vehicle.engineOn) {
            System.setVehicleMeta(vehicle, vehicleData);
            return;
        }

        //  Minus
        vehicleData.state.fuel -= HANDLE_CONFIG.FUEL_LOST;
        vehicleData.state.oil -= HANDLE_CONFIG.OIL_LOST;
        vehicleData.state.engineHealth -= HANDLE_CONFIG.ENGINE_HEALTH_LOST;

        //  ------------------------------------ Check --------------------------------------------
        
        if (vehicleData.state.fuel <= HANDLE_CONFIG.EMPTY || vehicleData.state.fuel === undefined) {
            vehicleData.state.fuel = HANDLE_CONFIG.EMPTY;
            System.turnOffEngine(vehicle, vehicleData);
        }
        if (vehicleData.state.oil <= HANDLE_CONFIG.EMPTY || vehicleData.state.oil === undefined) {
            vehicleData.state.oil = HANDLE_CONFIG.EMPTY;
            System.turnOffEngine(vehicle, vehicleData);
        }
        if (vehicleData.state.mileage >= HANDLE_CONFIG.MAX_MILEAGE || vehicleData.state.mileage === undefined) {
            vehicleData.state.mileage = HANDLE_CONFIG.MAX_MILEAGE;
            System.turnOffEngine(vehicle, vehicleData);
        }
        if (vehicleData.state.engineHealth <= HANDLE_CONFIG.EMPTY || vehicleData.state.engineHealth === undefined) {
            vehicleData.state.engineHealth = HANDLE_CONFIG.EMPTY;
            System.turnOffEngine(vehicle, vehicleData);
        }

        // -------------------- setVehMeta & SaveVehData & Debug ----------------------------------

        System.setVehicleMeta(vehicle, vehicleData);
        if (!vehicle.nextSave || Date.now() > vehicle.nextSave) {
            System.saveVehicleData(vehicle, vehicleData);
        }
        System.addDebugText_TickEnd(vehicle, vehicleData);
    }

    // ------------------------------ Stop Engine -------------------------------------------------

    static turnOffEngine(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        if (vehicle.engineOn) {
            vehicle.engineOn = false;
        }
    }

    // ---------------------------- saveVehicleData -----------------------------------------------

    static saveVehicleData(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        vehicleData.state.fuel = vehicleData.state.fuel ?? HANDLE_CONFIG.FUEL_CREATE;
        vehicleData.state.mileage = vehicleData.state.mileage ?? HANDLE_CONFIG.MILEAGE_CREATE;
        vehicleData.state.oil = vehicleData.state.oil ?? HANDLE_CONFIG.OIL_CREATE;
        vehicleData.state.engineHealth = vehicleData.state.engineHealth ?? HANDLE_CONFIG.ENGINE_HEALTH_CREATE;
        vehicleData.pos = vehicle.pos;
        vehicle.nextSave = Date.now() + 15000;
        System.addDebugText_saveVehicleData(vehicle, vehicleData);
    }
    // ------------------------ Set Vehicle Defaults ----------------------------------------------

    static setVehicleDefaults(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        vehicleData.state.oil = HANDLE_CONFIG.MAX_OIL;
        vehicleData.state.fuel = HANDLE_CONFIG.MAX_FUEL;
        vehicleData.state.mileage = HANDLE_CONFIG.MAX_MILEAGE;
        vehicleData.state.engineHealth = HANDLE_CONFIG.MAX_ENGINE_HEALTH;
        System.addDebugText_setVehicleDefaults(vehicle, vehicleData);
    }

    // ------------------------ Set Vehicle Meta --------------------------------------------------

    static setVehicleMeta(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        vehicle.setSyncedMeta(VEHICLE_STATE.FUEL, vehicleData.state.fuel);
        vehicle.setSyncedMeta(VEHICLE_STATE.MILEAGE, vehicleData.state.mileage);
        vehicle.setSyncedMeta(VEHICLE_STATE.OIL, vehicleData.state.oil);
        vehicle.setSyncedMeta(VEHICLE_STATE.ENGINE_HEALTH, vehicleData.state.engineHealth);
        vehicle.setSyncedMeta(VEHICLE_STATE.POSITION, vehicle.pos);
        System.addDebugText_setVehicleMeta(vehicle, vehicleData);
    }

    // -------------------- Enter Vehicle / wird unten gestartet -------------------------------------

    static enterVehicle(player: alt.Player, vehicle: alt.Vehicle) {
        let vehicleData = Athena.document.vehicle.get<IBaseVehicle>(vehicle);
        if (!vehicleData && vehicleData == undefined && vehicleData == null) {
            System.setVehicleDefaults(vehicle, vehicleData);
            return;
        }
        if (vehicleData) {
            System.addDebugText_enterVehicle(vehicle, vehicleData);
        }
    }    

    // ------------------------ Debug.txt Start ---------------------------------------------------

static async addDebugText(header: string, vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
    const jsonFileName = 'debug.txt';
    const textFilePath = path.join(
        process.cwd(),
        'src',
        'core',
        'plugins',
        'athena-plugin-fuelinsights',
        jsonFileName,
    );
    if (!fs.existsSync(textFilePath)) {
        fs.writeFileSync(textFilePath, '');
    }
    if (System.debugTextCount[header] && System.debugTextCount[header] % 200 === 0) {
        fs.writeFileSync(textFilePath, '');
    }
    System.debugTextCount[header] = (System.debugTextCount[header] || 0) + 1;
    fs.appendFileSync(textFilePath, `(Nr.:${System.debugTextCount[header]}) ${header} \n`);
    fs.appendFileSync(textFilePath, `${header} --> EnginHealth: ${vehicleData.state.engineHealth}\n`);
    fs.appendFileSync(textFilePath, `${header} --> Benzin: ${vehicleData.state.fuel} Liter       \n`);
    fs.appendFileSync(textFilePath, `${header} --> Öl: ${vehicleData.state.oil} Liter             \n`);
    fs.appendFileSync(textFilePath, `${header} --> Kilometerstand: ${vehicleData.state.mileage} Km \n`);
    fs.appendFileSync(textFilePath, `\n`);
}
    static debugTextCount: { [key: string]: number } = {};
    static async addDebugText_setVehicleMeta(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('setVehicleMeta', vehicle, vehicleData);
    }
    static async addDebugText_enterVehicle(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('Enter Vehicle', vehicle, vehicleData);
    }
    static async addDebugText_TickStart(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('Tick Start Übernahme Update Driver', vehicle, vehicleData);
    }
    static async addDebugText_TickEnd(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('TickEnd', vehicle, vehicleData);
    }
    static async addDebugText_saveVehicleData(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('Save', vehicle, vehicleData);
    }
    static async addDebugText_setVehicleDefaults(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('set Vehicle default', vehicle, vehicleData);
    }
    static async addDebugText_engineStarted(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('engine-started', vehicle, vehicleData);
    }
    static async addDebugText_hasDefaults(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('hasDefaults', vehicle, vehicleData);
    }
    static async addDebugText_useCommands(vehicle: alt.Vehicle, vehicleData: IBaseVehicle) {
        await System.addDebugText('useCommands', vehicle, vehicleData);
    }
}

alt.on('playerEnteredVehicle', System.enterVehicle);

//  ------------------------------------ Engine Toggle ---------------------------------------------

Athena.vehicle.events.on('engine-started', (vehicle: alt.Vehicle, player: alt.Player) => {
    let vehicleData = Athena.document.vehicle.get<IBaseVehicle>(vehicle);
    if (vehicleData && vehicleData.state.fuel <= HANDLE_CONFIG.EMPTY) {
        toggleEngine(vehicle);
        NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, LOCALE_HANDLE.VEH_NO_FUEL);
    }
    if (vehicleData && vehicleData.state.oil <= HANDLE_CONFIG.EMPTY) {
        toggleEngine(vehicle);
        NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, LOCALE_HANDLE.VEH_NO_OIL);
    }
    if (vehicleData && vehicleData.state.mileage >= HANDLE_CONFIG.MAX_MILEAGE) {
        toggleEngine(vehicle);
        NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, LOCALE_HANDLE.VEH_MAX_MILEAGE);
    }
    if (vehicleData && vehicleData.state.engineHealth <= HANDLE_CONFIG.EMPTY) {
        toggleEngine(vehicle);
        NotifyController.send(player, 11, 7, `Fahrzeugmeldung`, LOCALE_HANDLE.VEH_NO_ENGINE_HEALTH);
    }
    System.addDebugText_engineStarted(vehicle, vehicleData);
});
