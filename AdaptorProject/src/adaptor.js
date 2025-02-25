const fs = require('fs');
const path = require('path');

// Load the mapping configuration
const mapping = require('../config/mapping.json');

// Function to adapt payload from v1.2.5 to v2.0
const adaptPayload = (payloadV1) => {
    console.log('Input Payload (v1.2.5):', JSON.stringify(payloadV1, null, 2));
    
    const payloadV2 = {
        context: {},
        message: {
            intent: {
                fulfillment: {
                    type: payloadV1.message.intent.fulfillment.type,
                    stops: [] // Initialize stops as an array
                },
                provider: {}
            }
        }
    };

    // Function to set values in the new payload based on mapping
    const setValue = (source, target, value) => {
        const keys = target.split('.');
        let temp = payloadV2;

        // Traverse the new payload structure to set the value
        for (let i = 0; i < keys.length - 1; i++) {
            if (!temp[keys[i]]) {
                temp[keys[i]] = {};
            }
            temp = temp[keys[i]];
        }
        temp[keys[keys.length - 1]] = value;
    };

    // Map context attributes
    for (const key in mapping) {
        const value = mapping[key];
        const keys = key.split('.');
        let temp = payloadV1;

        // Traverse the input payload to get the value
        for (const k of keys) {
            if (temp[k] !== undefined) {
                temp = temp[k];
            } else {
                temp = undefined;
                break;
            }
        }

        // Set the value in the new payload
        if (temp !== undefined) {
            setValue(payloadV1, value, temp);
        }
    }

    // Handle stops dynamically based on the input payload and mapping
    const stopsMapping = [
        {
            id: "L1",
            parent_stop_id: "",
            type: "start",
            location: {
                gps: payloadV1.message.intent.fulfillment.start.location.gps,
                area_code: payloadV1.message.intent.fulfillment.start.location.address.area_code
            },
            authorization: {
                type: payloadV1.message.intent.fulfillment.start.authorization.type
            }
        },
        {
            id: "L2",
            parent_stop_id: "L1",
            type: "end",
            location: {
                gps: payloadV1.message.intent.fulfillment.end.location.gps,
                area_code: payloadV1.message.intent.fulfillment.end.location.address.area_code
            },
            authorization: {
                type: payloadV1.message.intent.fulfillment.end.authorization.type
            },
            instructions: {
                code: payloadV1.message.intent.fulfillment.end.instructions.code
            }
        }
    ];

    // Push stops to the array based on mapping
    stopsMapping.forEach(stop => {
        payloadV2.message.intent.fulfillment.stops.push(stop);
    });

    console.log('Transformed Payload (v2.0):', JSON.stringify(payloadV2, null, 2));
    return payloadV2;
};

// Read input payload
const inputFilePath = path.join(__dirname, '../input/search.json');
const outputFilePath = path.join(__dirname, '../output/search_output.json');

fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading input file:', err);
        return;
    }
    const payloadV1 = JSON.parse(data);
    const payloadV2 = adaptPayload(payloadV1);
    
    // Write output payload
    fs.writeFile(outputFilePath, JSON.stringify(payloadV2, null, 2), (err) => {
        if (err) {
            console.error('Error writing output file:', err);
            return;
        }
        console.log('Output payload has been written to', outputFilePath);
    });
});
