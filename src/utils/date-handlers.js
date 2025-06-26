

const OneMinuteFromNow = ()=> new Date(Date.now() + ( 1000 * 60 ));

const fiveMinutesFromNow = () => new Date(Date.now() + (1000 * 60 * 5)); 

const thirtyDaysFromNow = ()=> new Date(Date.now() + (1000 * 60 * 60 * 24 * 30 ));

export {
    OneMinuteFromNow,
    fiveMinutesFromNow,
    thirtyDaysFromNow
}