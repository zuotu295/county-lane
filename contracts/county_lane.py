# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
import re
from genlayer import Address, TreeMap, gl, i32, u256

CENSUS = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
FIPS = re.compile(r"[0-9]{5}")


def coordinate(value):
    magnitude = abs(value)
    return ("-" if value < 0 else "") + f"{magnitude // 10000}.{magnitude % 10000:04d}"


def county_from_geographies(document):
    counties = document["result"]["geographies"]["Counties"]
    if not isinstance(counties, list) or len(counties) != 1:
        raise ValueError("Point has no unique county")
    code = counties[0]["GEOID"]
    if not isinstance(code, str) or not FIPS.fullmatch(code):
        raise ValueError("Invalid county GEOID")
    return code


class CountyLane(gl.Contract):
    organizer: Address
    limits: TreeMap[str, u256]
    used: TreeMap[str, u256]
    bookings: TreeMap[Address, str]
    active_points: TreeMap[str, Address]

    def __init__(self, counties: list[str], limits: list[u256]):
        if not 1 <= len(counties) <= 16 or len(counties) != len(limits) or len(set(counties)) != len(counties):
            raise gl.vm.UserError("Provide 1 to 16 distinct county quotas")
        self.organizer = gl.message.sender_address
        for county, limit in zip(counties, limits):
            if not FIPS.fullmatch(county) or not 1 <= limit <= 10000:
                raise gl.vm.UserError("Invalid county quota")
            self.limits[county] = limit

    @gl.public.write
    def authorize(self, guest: Address, latitude_e4: i32, longitude_e4: i32):
        if self.organizer != gl.message.sender_address:
            raise gl.vm.UserError("Only the organizer can authorize")
        if guest == Address("0x" + "0" * 40):
            raise gl.vm.UserError("Guest address cannot be zero")
        if not -900000 <= latitude_e4 <= 900000 or not -1800000 <= longitude_e4 <= 1800000:
            raise gl.vm.UserError("Invalid coordinate")
        previous = self.bookings.get(guest, "")
        if previous and json.loads(previous)["state"] != "RELEASED":
            raise gl.vm.UserError("Guest already has a live authorization")
        self.bookings[guest] = json.dumps({
            "state": "AUTHORIZED", "latitude_e4": int(latitude_e4),
            "longitude_e4": int(longitude_e4), "county": "",
        }, separators=(",", ":"))

    @gl.public.write
    def reserve(self) -> str:
        guest = gl.message.sender_address
        booking = json.loads(self.bookings.get(guest, "{}"))
        if booking.get("state") != "AUTHORIZED":
            raise gl.vm.UserError("A live authorization is required")
        point = coordinate(booking["longitude_e4"]) + "," + coordinate(booking["latitude_e4"])
        if point in self.active_points:
            raise gl.vm.UserError("This coordinate already holds a slot")
        longitude, latitude = point.split(",")
        url = (
            CENSUS + "?x=" + longitude + "&y=" + latitude
            + "&benchmark=Public_AR_Census2020&vintage=Census2020_Census2020&layers=Counties&format=json"
        )

        def observe() -> str:
            response = gl.nondet.web.get(url)
            try:
                return county_from_geographies(json.loads(response.body.decode("utf-8")))
            except (KeyError, ValueError, TypeError, AttributeError):
                raise gl.vm.UserError("Census did not return a single verified county")

        county = gl.eq_principle.strict_eq(observe)
        occupied = self.used.get(county, u256(0))
        if occupied >= self.limits.get(county, u256(0)):
            raise gl.vm.UserError("No slot available for county " + county)
        booking.update({"county": county, "state": "RESERVED"})
        self.bookings[guest] = json.dumps(booking, separators=(",", ":"))
        self.active_points[point] = guest
        self.used[county] = u256(occupied + 1)
        return county

    @gl.public.write
    def release(self, guest: Address):
        if gl.message.sender_address not in (guest, self.organizer):
            raise gl.vm.UserError("Only the guest or organizer can release")
        booking = json.loads(self.bookings.get(guest, "{}"))
        if booking.get("state") not in ("AUTHORIZED", "RESERVED"):
            raise gl.vm.UserError("No live booking to release")
        if booking["state"] == "RESERVED":
            county = booking["county"]
            point = coordinate(booking["longitude_e4"]) + "," + coordinate(booking["latitude_e4"])
            del self.active_points[point]
            self.used[county] = u256(self.used[county] - 1)
        booking["state"] = "RELEASED"
        self.bookings[guest] = json.dumps(booking, separators=(",", ":"))

    @gl.public.view
    def get_booking(self, guest: Address) -> str:
        return self.bookings.get(guest, "")

    @gl.public.view
    def capacity(self, county: str) -> str:
        return json.dumps({
            "limit": int(self.limits.get(county, u256(0))),
            "used": int(self.used.get(county, u256(0))),
        }, separators=(",", ":"))
