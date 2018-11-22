import Async from "crocks/Async"

const KEY = process.env.DB_KEY
const BIKES_API = "https://bicycles-c170.restdb.io/rest/bikes"

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
	
	xhr.send(data);
})

const listBikes = () => request(BIKES_API, "GET", null)
const createBike = data => request(BIKES_API, "GET", data)

export {
	createBike,
	listBikes,
}
