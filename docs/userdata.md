# express-sharp-server 

### userdata

The latter can be extended, vie a HTTP PUT request, by user data. Useful to save image license information.

```json
{
    "userdata": {
        "license": {
            "label": "CC BY-SA 4.0",
            "href": "https://creativecommons.org/licenses/by-sa/4.0",
            "attribution": "Ggerdel at Wikimedia Commons"
        }
    }
}
```

```sh
curl --header "Content-Type: application/json" \
  --request PUT \
  --data '{ "userdata": { "license": { "label": "CC BY-SA 4.0", "href": "https://creativecommons.org/licenses/by-sa/4.0", "attribution": "Ggerdel at Wikimedia Commons" } } } ' \
  http://localhost:8080/
```
