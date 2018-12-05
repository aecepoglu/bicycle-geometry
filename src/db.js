import Async from "crocks/Async"

const KEY = process.env.DB_KEY
const BIKES_API = "https://bicycles-c170.restdb.io/rest/bikes"

// request :: (String, String, Object) -> Async RawBikeModel
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

const listBikes = () => request(BIKES_API, "GET", undefined)
const createBike = data => request(BIKES_API, "POST", data)
const createBikeMock = data => Async((reject, resolve) => {
	window.setTimeout(() => {
		resolve(Object.assign({_id: "123123123123"}, data));
	}, 3000);
});

export {
	createBike,
	createBikeMock,
	listBikes,
}
