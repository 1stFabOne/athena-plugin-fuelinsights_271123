import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api/index.js';
import stations from './fuelstationlocation.js';
import { LOCALE_FUEL_STATIONS } from '../../shared/locales.js';
import { CurrencyTypes } from '@AthenaShared/enums/currency.js';
import { JobTrigger } from '@AthenaShared/interfaces/jobTrigger.js';
import { distance2d } from '@AthenaShared/utility/vector.js';
import { deepCloneObject } from '@AthenaShared/utility/deepCopy.js';
import { STATION_CONFIG, HANDLE_NAME, PROGRESSBAR } from './config.js';
import { VIEW_EVENTS_FUEL_TRIGGER } from '../../shared/vehicle.js';
import { IBaseVehicle, LastTriggers, fuelInfo, maximumFuel } from '../../shared/interfaces/ibasevehicle.js';
import { NotifyController } from '@AthenaPlugins/athena-plugin-notifications/server/controller.js';

export class FuelStationSystem {
    static init() {
        alt.onClient(VIEW_EVENTS_FUEL_TRIGGER.ACCEPT, FuelStationSystem.acceptDialog);
        alt.onClient(VIEW_EVENTS_FUEL_TRIGGER.CANCEL, FuelStationSystem.cancelDialog);
        for (let i = 0; i < stations.length; i++) {
            const fuelPump = stations[i];
            if (fuelPump.isBlip) {
                Athena.controllers.blip.append({
                    text: LOCALE_FUEL_STATIONS.FUEL_STATION,
                    color: 1,
                    sprite: 361,
                    scale: 0.7,
                    shortRange: true,
                    pos: fuelPump,
                    uid: `${LOCALE_FUEL_STATIONS.FUEL_STATION}-${i}`,
                });
            }
            Athena.controllers.interaction.append({
                uid: `${LOCALE_FUEL_STATIONS.FUEL_STATION}-Interact-${i}`,
                position: fuelPump,
                description: `${LOCALE_FUEL_STATIONS.FUEL_STATIONPOINT}`,
                callback: FuelStationSystem.request,
                debug: false,
            });
        }
    }


    static request(player: alt.Player) {
        if (player.vehicle) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_MUST_EXIT_VEHICLE);
            return;
        }
        if (fuelInfo[player.id] && Date.now() < fuelInfo[player.id].timeout) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_ALREADY_REFILLING);
            return;
        }
        if (fuelInfo[player.id] && Date.now() > fuelInfo[player.id].timeout) {
            delete fuelInfo[player.id];
        }
        const closestVehicle = Athena.utility.vector.getClosestEntity<alt.Vehicle>(
            player.pos,
            player.rot,
            [...alt.Vehicle.all],
            2,
            true,
        ) as alt.Vehicle;
        if (!closestVehicle) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_TOO_FAR_FROM_PUMP);
            return;
        }
        const vehicleData = Athena.document.vehicle.get<IBaseVehicle>(closestVehicle);
        if (!closestVehicle || !vehicleData) {
            return;
        }
        if (closestVehicle.isRefueling) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_ALREADY_REFILLING);
            return;
        }
        const dist = distance2d(player.pos, closestVehicle.pos);
        if (dist >= 4) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_TOO_FAR_FROM_PUMP);
            return;
        }
        if (!vehicleData) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_ALREADY_FULL);
            return;
        }
        const vehData = Athena.document.vehicle.get<IBaseVehicle>(closestVehicle);
        if (vehData.fuel >= 99) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_ALREADY_FULL);
            return;
        }
        const currentFuel = vehData.fuel;
        let missingFuel = maximumFuel - currentFuel;
        let maximumCost = missingFuel * STATION_CONFIG.FUEL_PRICE;
        const PlayerData = Athena.document.character.get(player);
        if (PlayerData.cash < maximumCost) {
            maximumCost = STATION_CONFIG.FUEL_PRICE * PlayerData.cash;
            missingFuel = missingFuel - STATION_CONFIG.FUEL_PRICE * PlayerData.cash;
            if (missingFuel <= 2) {
                NotifyController.send(player, 10, 7, `Stationmeldung`, `${LOCALE_FUEL_STATIONS.FUEL_CANNOT_AFFORD} $${maximumCost}`);
                return;
            }
        }
        missingFuel = Math.floor(missingFuel);
        const trigger: JobTrigger = {
            header: LOCALE_FUEL_STATIONS.FUEL_HEADERFUEL,
            acceptCallback: FuelStationSystem.start,
            cancelCallback: FuelStationSystem.cancel,
            image: LOCALE_FUEL_STATIONS.FUEL_IMAGE,
            summary: `Wieviel Treibstoff möchten Sie im ${vehicleData.model} nachfüllen, wenn es ${STATION_CONFIG.FUEL_PRICE}$ kostet?`,
            maxAmount: missingFuel,
        };
        fuelInfo[player.id] = {
            cost: STATION_CONFIG.FUEL_PRICE,
            fuel: missingFuel,
            vehicle: closestVehicle,
            timeout: Date.now() + STATION_CONFIG.FUEL_RESET_TIMEOUT,
        };
        LastTriggers[player.id] = trigger;
        alt.emitClient(player, VIEW_EVENTS_FUEL_TRIGGER.OPEN, deepCloneObject(trigger));
    }

    static start(player: alt.Player, fuelAmount: number) {
        if (!player || !player.valid) {
            return;
        }
        const id = player.id;
        if (!fuelInfo[id]) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_TRY_AGAIN);
            return;
        }
        const data = fuelInfo[id];
        if (data.vehicle.isRefueling) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_ALREADY_REFILLING);
            delete fuelInfo[id];
            return;
        }
        if (data.vehicle.engineOn) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_TURN_OFF_ENGINE);
            return;
        }
        if (!Athena.player.currency.sub(player, CurrencyTypes.CASH, data.cost * fuelAmount)) {
            NotifyController.send(player, 10, 7, `Stationmeldung`, `${LOCALE_FUEL_STATIONS.FUEL_CANNOT_AFFORD} $${data.cost * fuelAmount}`);
            delete fuelInfo[id];
            return;
        }
        let totalRefuelingTime = fuelAmount * STATION_CONFIG.FUEL_TIME;
        if (data.vehicle && data.vehicle.valid && (data.vehicle.isRefueling = true)) {
            data.vehicle.frozen = true;
        } else {
            NotifyController.send(player, 10, 7, `Stationmeldung`, LOCALE_FUEL_STATIONS.FUEL_NO_VEHICLE);
            delete fuelInfo[id];
            return;
        }
        const PlayerData = Athena.document.character.get(player);
        Athena.player.emit.createProgressBar(player, {
            uid: `${LOCALE_FUEL_STATIONS.FUEL}-${PlayerData._id.toString()}`,
            color: PROGRESSBAR.COLOR,
            distance: PROGRESSBAR.DISTANCE,
            milliseconds: totalRefuelingTime,
            position: data.vehicle.pos,
            text: LOCALE_FUEL_STATIONS.FUELING_PROGRESS_BAR,
        });
        alt.setTimeout(() => {
            const PlayerData = Athena.document.character.get(player);
            if (player) {
                Athena.player.emit.removeProgressBar(player, `${LOCALE_FUEL_STATIONS.FUEL}-${PlayerData._id.toString()}`);
                NotifyController.send(player, 10, 7, `Stationmeldung`, `${LOCALE_FUEL_STATIONS.FUEL_COST}${(data.cost * fuelAmount).toFixed(2)} | ${fuelAmount.toFixed(2,)}`,);
            }
            data.vehicle.frozen = false;
            const veh = Athena.document.vehicle.get<IBaseVehicle>(data.vehicle);
            veh.state.fuel += fuelAmount;
            Athena.document.vehicle.set(data.vehicle, HANDLE_NAME.FUEL, veh.state.fuel);
            console.log(`${veh.state.fuel}`);
            delete fuelInfo[id];
        }, totalRefuelingTime);
    }

    static cancel(player: alt.Player) {
        if (fuelInfo[player.id]) {
            delete fuelInfo[player.id];
        }
    }

    static acceptDialog(player: alt.Player, amount: number) {
        if (!player || !player.valid) {
            return;
        }
        if (!LastTriggers[player.id]) {
            return;
        }
        const data = LastTriggers[player.id];
        if (data.event) {
            alt.emit(data.event, player);
        }
        if (data.acceptCallback && typeof data.acceptCallback === 'function') {
            data.acceptCallback(player, amount);
        }
        delete LastTriggers[player.id];
    }

    static cancelDialog(player: alt.Player) {
        if (!player || !player.valid) {
            return;
        }
        if (!LastTriggers[player.id]) {
            return;
        }
        const data = LastTriggers[player.id];
        if (data.cancelEvent) {
            alt.emit(data.cancelEvent, player);
        }
        if (data.cancelCallback && typeof data.cancelCallback === 'function') {
            data.cancelCallback(player);
        }
        delete LastTriggers[player.id];
    }
}
