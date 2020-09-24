const app = require('./app');

app.set('port', process.env.PORT || 3000);
app.set('address', process.env.NODE_IP || '0.0.0.0');

app.listen(app.get('port'), app.get('address'), function() {
    console.log(`Server running: http://${app.get('address')}:${app.get('port')}`);
});
