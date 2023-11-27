import * as alt from 'alt-server';
import * as Athena from '@AthenaServer/api/index.js';
import { System } from './src/system.js';
import { FuelStationSystem } from './src/fuelstation.js';
import './src/fuelcommands.js';

const PLUGIN_NAME = 'Fuelinsights';
Athena.systems.plugins.registerPlugin(PLUGIN_NAME, () => {    

    System.init();
    FuelStationSystem.init();

    alt.log(`~lg~[Athena-Plugin] ==> ${PLUGIN_NAME} erfolgreich geladen.`,
    );
});
