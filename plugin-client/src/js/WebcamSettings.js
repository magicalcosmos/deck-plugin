document.addEventListener('websocketCreate', function () {
    console.log("Websocket created!");
    showHideSettings(actionInfo.payload.settings);

    websocket.addEventListener('message', function (event) {
        console.log("Got message event!");

        // Received message from Stream Deck
        var jsonObj = JSON.parse(event.data);

        if (jsonObj.event === 'sendToPropertyInspector') {
            var payload = jsonObj.payload;
            showHideSettings(payload);
        }
        else if (jsonObj.event === 'didReceiveSettings') {
            var payload = jsonObj.payload;
            showHideSettings(payload.settings);
        }
    });
});

function showHideSettings(payload) {
    console.log("Show Hide Settings Called");
    setManualSet("none");
    setManualAdjust("none");
    showHideTitleSettings("none");

    if (payload['showValueOnKey']) {
        showHideTitleSettings("");
    }

    if (payload['settingManualSet']) {
        setManualSet("");
        setManualRange(payload);
    }

    if (payload['settingManualAdjust']) {
        setManualAdjust("");
    }
    checkValidProperty(payload);
}

function setManualAdjust(displayValue) {
    var dvSettingsManualAdjust = document.getElementById('dvSettingsManualAdjust');
    dvSettingsManualAdjust.style.display = displayValue;
}

function showHideTitleSettings(displayValue) {
    var dvTextSettings = document.getElementById('dvTextSettings');
    dvTextSettings.style.display = displayValue;
}

function setManualSet(displayValue) {
    var dvSettingsManualSet = document.getElementById('dvSettingsManualSet');
    dvSettingsManualSet.style.display = displayValue;
}

function setManualRange(payload) {
    if (payload['propertyInfo']) {
        let propertyInfo = payload['propertyInfo'];
        var range = document.getElementById('manualSetValue');
        range.attributes['min'].value = propertyInfo.minValue;
        range.attributes['max'].value = propertyInfo.maxValue;
        if (range.value < propertyInfo.minValue || range.value > propertyInfo.maxValue) {
            range.value = propertyInfo.defaultValue;
        }
    }
}

function checkValidProperty(payload) {
    var manualSet = document.getElementById('dvSettingsManualSet');
    var manualAdjust = document.getElementById('dvSettingsManualAdjust');
    var notSupported = document.getElementById('manualSetNotSupported');
    notSupported.style.display = "none";

    if (payload['propertyInfo']) {
        let propertyInfo = payload['propertyInfo'];

        if (propertyInfo.minValue == propertyInfo.maxValue && propertyInfo.minValue == 0) {
            manualSet.style.display = "none";
            manualAdjust.style.display = "none";
            notSupported.style.display = "";
        }
    }
}

