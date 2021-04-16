const IconTypes = {
  0: {
    iconLayout: 'default#image',
    iconImageClipRect: [
      [0, 0],
      [30, 26],
    ],
    iconImageHref: 'img/shop.png',
    iconImageSize: [30, 26],
  },
  1: {
    iconLayout: 'default#image',
    iconImageClipRect: [
      [0, 0],
      [25, 31],
    ],
    iconImageHref: 'img/flag.png',
    iconImageSize: [25, 31],
  },
};

const ObjectTypes = {
  'Магазин сети': 0,
  'Точка выдачи': 1,
};

const ObjectTypesPlural = {
  'Магазины сети': 0,
  'Точки выдачи': 1,
};

ymaps.ready(() => {
  initMap();
  addPoints();
  addFilterControl();
  getAddress();
  addFindRouteBtn();
});

function initMap() {
  window.map = new ymaps.Map('map', {
    center: [47.221667, 39.704472],
    zoom: 14,
    autoFitToViewport: true,
    controls: ['geolocationControl'],
  });
}

function addFindRouteBtn() {
  const button = new ymaps.control.Button({
    data: { content: 'Ближайшая точка' },
    options: { selectOnClick: false, maxWidth: 400 },
  });
  map.controls.add(button);
  button.events.add('click', async () => {
    await getUserLocation();
    findNearestRoute();
  });
}

function addPoints() {
  try {
    const objectManager = new ymaps.ObjectManager({ clusterize: true, gridSize: 128, maxZoom: 14 });
    const pointsOnMap = {
      type: 'FeatureCollection',
      features: points.map((point, i) => ({
        type: 'Feature',
        id: i,
        geometry: { type: 'Point', coordinates: point.coords },
        properties: {
          hintContent: 'Загрузка адреса...',
          balloonContentHeader: `${Object.keys(ObjectTypes)[point.type]} №${i + 1}`,
          balloonContentBody: 'Загрузка адреса...',
        },
        options: IconTypes[point.type],
      })),
    };

    map.geoObjects.add(objectManager);
    objectManager.add(pointsOnMap);

    map.setBounds(objectManager.getBounds());
    map.objectManager = objectManager;
  } catch (err) {
    console.error(err);
  }
}

function addFilterControl() {
  const listBoxItems = Object.keys(ObjectTypesPlural).map(
    title => new ymaps.control.ListBoxItem({ data: { content: title }, state: { selected: true } }),
  );

  const listBoxControl = new ymaps.control.ListBox({
    data: { content: 'Фильтр', title: 'Фильтр' },
    items: listBoxItems,
    state: {
      filters: listBoxItems.reduce((filters, filter) => {
        filters[filter.data.get('content')] = filter.isSelected();
        return filters;
      }, {}),
    },
  });

  map.controls.add(listBoxControl);

  listBoxControl.events.add(['select', 'deselect'], event => {
    const listBoxItem = event.get('target');
    const filters = ymaps.util.extend({}, listBoxControl.state.get('filters'));
    filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
    listBoxControl.state.set('filters', filters);
  });

  const filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add('filters', filters =>
    map.objectManager.setFilter(obj => {
      const { iconImageHref } = obj.options;
      const objType = Object.entries(IconTypes).find(i => i[1].iconImageHref === iconImageHref)[0];
      return filters[Object.keys(ObjectTypesPlural)[objType]];
    }),
  );
}

function getAddress() {
  try {
    map.objectManager.objects.each(async obj => {
      const coords = obj.geometry.coordinates;
      const address = (await ymaps.geocode(coords)).geoObjects.get(0).properties.get('name');
      obj.properties.hintContent = address;
      obj.properties.balloonContentBody = address;
    });
  } catch (err) {
    console.error(err);
  }
}

async function getUserLocation() {
  try {
    const userLocation = await ymaps.geolocation.get();

    const userAddress = userLocation.geoObjects.get(0).properties.get('text');
    const userCoodinates = userLocation.geoObjects.get(0).geometry.getCoordinates();

    map.geoObjects.add(
      new ymaps.Placemark(
        userCoodinates,
        { iconCaption: userAddress, hintContent: userAddress },
        { preset: 'islands#geolocationIcon' },
      ),
    );

    map.userLocation = userLocation;
    map.userCoodinates = userCoodinates;
  } catch (err) {
    console.error(err);
    alert('Необходимо разрешить доступ к геоданным ');
  }
}

async function findNearestRoute() {
  const closest = await ymaps.geoQuery(map.objectManager.objects).getClosestTo(map.userCoodinates);
  const pointCoords = closest.geometry.getCoordinates();

  const route = new ymaps.multiRouter.MultiRoute(
    {
      referencePoints: [map.userCoodinates, pointCoords],
    },
    {
      wayPointVisible: false,
      routeStrokeColor: '000088',
      routeActiveStrokeColor: 'ff0000',
      pinIconFillColor: 'ff0000',
      boundsAutoApply: true,
      zoomMargin: 30,
    },
  );

  map.geoObjects.add(route);
}
