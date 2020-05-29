import Maps from '../maps.json';


export async function getAdapter (mapKeyName) {
    return class Adapter {
	constructor (map) {
	    this.map = map
	}

	async adapt (ctx) {

	}
    }
}
