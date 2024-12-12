const fs = require('fs');
const QuickChart = require('quickchart-js');

// Fonction pour générer la visualisation du taux d'occupation
const generateChart = (room, occupiedCount, totalSlots) => {
    const percentage = ((occupiedCount / totalSlots) * 100).toFixed(2);
    const chart = new QuickChart();
    chart.setConfig({
        type: 'pie',
        data: {
            labels: ['Occupied', 'Free'],
            datasets: [{
                label: 'Room Occupancy',
                data: [percentage, 100 - percentage],
                backgroundColor: ['#FF5733', '#33FF57'],
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw.toFixed(2)}%`
                    }
                }
            }
        }
    });
    chart.setWidth(400).setHeight(400);
    return chart.getUrl(); // Retourne l'URL du graphique
};

module.exports = {generateChart};