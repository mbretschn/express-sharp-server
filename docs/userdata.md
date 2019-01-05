# express-sharp-server 

### Userdata

Via a HTTP PUT request, userdata can be added or changed to the image information stored. Useful to save image license information. Only data below the userdata field is considered by the middleware.

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

If a image resource is created via origin, userdata can directly send with the json payload.

```json
{
    "_links": {
        "origin": {
            "href": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Elefantes_Gustavo_Gerdel.jpg"
        }
    },
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
  --request POST \
  --data '{ "_links": { "origin": { "href": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Elefantes_Gustavo_Gerdel.jpg" } }, "userdata": { "license": { "label": "CC BY-SA 4.0", "href": "https://creativecommons.org/licenses/by-sa/4.0", "attribution": "Ggerdel at Wikimedia Commons" } } }' \
  http://localhost:8080/
```

The developer is free to save any userdata to a image. However, only information below userdata is considered.

The following example illustrates how userdata can be used to show image information in a webpage.

```html
<figure>
    <img src="http://localhost:8080/4177b853a81a0b5490082452f13edc37?width=400&height=200" width="400" height="200">
</figure>

<script>
  document.addEventListener("DOMContentLoaded", function (event) {
    let image = document.querySelector('img');
    let url = image.src;

    fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (myJSON) {
      let newContent = document.createTextNode(myJSON.userdata.license.attribution); 

      let newAnchor = document.createElement("a");
      newAnchor.href = myJSON.userdata.license.href;
      newAnchor.target = "_blank";

      let newLicense = document.createTextNode(myJSON.userdata.license.label); 
      newAnchor.appendChild(newLicense);

      let figCaption = document.createElement("figcaption");

      figCaption.appendChild(newContent);
      figCaption.appendChild(newAnchor);

      image.after(figCaption);
    });
  });
</script>
```