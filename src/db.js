import Async from "crocks/Async"

const KEY = process.env.DB_KEY
const BIKES_API = "https://bicycles-c170.restdb.io/rest/bikes"

// request :: (String, String, Object) -> Async Anything
const request = (url, method, data) => Async((reject, resolve) => {
	let xhr = new XMLHttpRequest();
	//xhr.withCredentials = true;
	
	xhr.addEventListener("readystatechange", function () {
		if (xhr.readyState === 4) {
			if (xhr.status >= 200 && xhr.status < 400) {
				try {
					resolve(JSON.parse(xhr.responseText))
				} catch (err) {
					reject(err)
				}
			} else {
				reject(xhr.responseText)
			}
		}
	});
	
	xhr.open(method, url);

	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("x-apikey", KEY);
	xhr.setRequestHeader("cache-control", "no-cache");
	
	xhr.send(data ? JSON.stringify(data) : data);
})

// listBikes :: () -> Async [RawBikeModel]
const listBikes = () => request(BIKES_API, "GET", undefined)
const listBikesMock = () => Async((reject, resolve) => {
	window.setTimeout(() => {
		resolve([
		 {"_id":"5bf59787770d2f4d00005ec2","seatTubeAngle":73,"name":"Surly LHT","wheelbaseLen":1055.6,"topTubeLen":564.5,"chainstayLen":460.2,"seatTubeLen":560,"headTubeLen":152,"forkLen":390,"bbDropLen":78,"seatTubeExtra":20,"headTubeAngle":72,"reachLen":389.3,"stackLen":588,"forkOffset":45,"thickness":14},
		 {"_id":"5c23b25f4093631f000046f9","seatTubeAngle":73.50000000000001,"name":"Surly Steamroller 56cm","bbDropLen":70,"reachLen":402.3,"seatTubeLen":560,"wheelbaseLen":978.6,"chainstayLen":398,"topTubeLen":568,"seatTubeExtra":20,"forkLen":390,"headTubeLen":136,"stackLen":558.8,"headTubeAngle":73.50000000000001,"forkOffset":38.079505104835995,"thickness":14},
		 {"_id":"5c23da864093631f00004d87","seatTubeAngle":72.50000000000001,"name":"Surly PackRat 56cm","bbDropLen":55,"reachLen":408,"seatTubeLen":560,"wheelbaseLen":1006,"chainstayLen":415,"topTubeLen":582.5,"seatTubeExtra":20,"forkLen":390,"headTubeLen":160,"stackLen":547,"headTubeAngle":73.99999999999997,"forkOffset":43.816225032220096,"thickness":14},
		 {"_id":"5d71b95b72bc60350000cb7c","seatTubeAngle":72.99999999999999,"name":"Surly Cross Check (54cm)","bbDropLen":66,"reachLen":394.8,"seatTubeLen":540,"wheelbaseLen":1014.3,"chainstayLen":425,"topTubeLen":559.9,"seatTubeExtra":20,"forkLen":400,"headTubeLen":102,"stackLen":538.4,"headTubeAngle":72,"forkOffset":43.904493933170976,"thickness":14},
		])
	}, 5000)
})
// listBikes :: RawBikeModel -> Async RawBikeModel
const createBike = data => request(BIKES_API, "POST", data)
const createBikeMock = data => Async((reject, resolve) => {
	window.setTimeout(() => {
		resolve(Object.assign({_id: "123123123123"}, data));
	}, 3000)
})

export {
	createBike,
	createBikeMock,
	listBikes,
	listBikesMock,
}
