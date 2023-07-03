module.exports = (e, data) => {
    console.log(' ')
    console.log(data)
    let list = '';

    data.contaminants.forEach(d => {
        if (d.total === 0) return;
        list += `
                <li>
                    <p><span class="bold">${d.contaminant}:</span> $${Math.round(d.total_impact_value, 0)}</p>
                    <p>Impact scale: ${Math.round(d.total_impact_scale * 10) / 10}</p>
                </li>
            `;
    });

    return `
        <div class="popup-container">
            <h2>${data.org}</h2>
            <p class="subhead">Metric tonnes emitted, 2009-2021</p>
            <ul class="popup-list">${list}</ul>
        </div>
    `;
}