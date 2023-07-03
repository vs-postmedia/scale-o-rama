module.exports = (data_obj) => {
    let list = '';
    const data = data_obj.sumByContaminant;

    // we're iterating over an object (i know, i know <rolling_eyes>)
    for (const d in data) {
        console.log(data[d].total_released)
        const released = data[d].total_released
                .toFixed(2)
                .toLocaleString('en-US');

        const cost = data[d].total_impact_value
            .toLocaleString('en-US')
            .split('.')[0];

        const scale = data[d].total_impact_scale
            .toFixed(1)
            .toLocaleString()

        console.log(data[d].total_impact_value)
        console.log(released)

        list += `
                <li>
                    <ul>
                        <span class="bold">${d}:</span>
                        <p>Metric tonnes released:</span> ${released}</p>
                        <p>Health cost:</span> $${cost}</p>
                        <p>Impact scale: ${scale}</p>
                    </ul>
                </li>
            `;
    }

    return `
        <div class="popup-container">
            <h2>${data.org}</h2>
            <p class="subhead">Total values, 2009-2021</p>
            <ul class="popup-list">${list}</ul>
        </div>
    `;
}