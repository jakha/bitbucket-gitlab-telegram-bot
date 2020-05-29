import Maps from '../maps.json';

class Adapter {
    constructor (map) {
	this.map = map
    }
    
    adapt (body) {
	let data = Object.create(null);
	for(let field in this.map){
	    data[field] = getValue(body, this.map[field]); 
	}

	return data;
    }
}

function getValue(object, path) {
    return path.split('.').reduce((target, v) => target = target[v], object);
}

export async function getAdapter (mapKeyName) {
    return new Adapter(Maps[mapKeyName]);
}


