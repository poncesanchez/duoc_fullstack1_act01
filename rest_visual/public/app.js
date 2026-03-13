const methodSelect = document.getElementById('method');
const petIdInput = document.getElementById('pet-id');
const nombreInput = document.getElementById('nombre');
const edadInput = document.getElementById('edad');
const imagenInput = document.getElementById('imagen');
const descripcionInput = document.getElementById('descripcion');
const ciudadInput = document.getElementById('ciudad');

const requestForm = document.getElementById('request-form');
const reloadButton = document.getElementById('reload-table');
const requestPreview = document.getElementById('request-preview');
const responseOutput = document.getElementById('response-output');
const petsTableBody = document.getElementById('pets-table-body');

function getBaseUrl() {
  return `${window.location.origin}/api/mascotas`;
}

function buildRequestPreview() {
  const method = methodSelect.value;
  const id = petIdInput.value.trim();

  const url =
    method === 'GET' || method === 'DELETE' || method === 'PUT' || method === 'PATCH'
      ? id
        ? `${getBaseUrl()}/${id}`
        : getBaseUrl()
      : getBaseUrl();

  const body = {
    nombre: nombreInput.value || undefined,
    edad: edadInput.value ? Number(edadInput.value) : undefined,
    imagen: imagenInput.value || undefined,
    descripcion: descripcionInput.value || undefined,
    ciudad: ciudadInput.value || undefined
  };

  Object.keys(body).forEach((key) => {
    if (typeof body[key] === 'undefined' || body[key] === '') {
      delete body[key];
    }
  });

  const hasBody =
    method === 'POST' || method === 'PUT' || method === 'PATCH';

  const preview = {
    method,
    url,
    ...(hasBody && Object.keys(body).length > 0 ? { body } : {})
  };

  requestPreview.textContent = JSON.stringify(preview, null, 2);
  requestPreview.classList.toggle('empty', false);
}

function renderPetsTable(pets) {
  petsTableBody.innerHTML = '';

  if (!pets || pets.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'empty-cell';
    td.textContent =
      'No hay mascotas registradas todavía. Crea una nueva o recarga más tarde.';
    tr.appendChild(td);
    petsTableBody.appendChild(tr);
    return;
  }

  pets.forEach((pet) => {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = pet.id;

    const tdNombre = document.createElement('td');
    tdNombre.textContent = pet.nombre;

    const tdEdad = document.createElement('td');
    tdEdad.textContent = pet.edad;

    const tdImagen = document.createElement('td');
    if (pet.imagen) {
      const img = document.createElement('img');
      img.src = pet.imagen;
      img.alt = pet.nombre || 'Mascota';
      tdImagen.appendChild(img);
    } else {
      tdImagen.textContent = '—';
    }

    const tdDesc = document.createElement('td');
    tdDesc.textContent = pet.descripcion || '—';

    const tdCiudad = document.createElement('td');
    tdCiudad.textContent = pet.ciudad || '—';

    tr.appendChild(tdId);
    tr.appendChild(tdNombre);
    tr.appendChild(tdEdad);
    tr.appendChild(tdImagen);
    tr.appendChild(tdDesc);
    tr.appendChild(tdCiudad);

    petsTableBody.appendChild(tr);
  });
}

async function fetchPetsAndRender() {
  try {
    const res = await fetch(getBaseUrl());
    const data = await res.json();
    if (Array.isArray(data)) {
      renderPetsTable(data);
    }
  } catch (error) {
    console.error(error);
  }
}

async function sendRequest(event) {
  event.preventDefault();
  const method = methodSelect.value;
  const id = petIdInput.value.trim();

  let url = getBaseUrl();
  if (id && (method === 'GET' || method === 'DELETE' || method === 'PUT' || method === 'PATCH')) {
    url = `${url}/${id}`;
  }

  const body = {
    nombre: nombreInput.value || undefined,
    edad: edadInput.value ? Number(edadInput.value) : undefined,
    imagen: imagenInput.value || undefined,
    descripcion: descripcionInput.value || undefined,
    ciudad: ciudadInput.value || undefined
  };

  Object.keys(body).forEach((key) => {
    if (typeof body[key] === 'undefined' || body[key] === '') {
      delete body[key];
    }
  });

  const hasBody =
    method === 'POST' || method === 'PUT' || method === 'PATCH';

  const fetchOptions = {
    method,
    headers: {}
  };

  if (hasBody && Object.keys(body).length > 0) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  buildRequestPreview();

  try {
    const res = await fetch(url, fetchOptions);
    const contentType = res.headers.get('Content-Type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    const responseMeta = {
      status: res.status,
      ok: res.ok,
      data
    };

    responseOutput.textContent = JSON.stringify(responseMeta, null, 2);
    responseOutput.classList.toggle('response-error', !res.ok);
    responseOutput.classList.toggle('empty', false);

    if (method === 'GET') {
      if (Array.isArray(data)) {
        renderPetsTable(data);
      } else if (data && typeof data === 'object') {
        renderPetsTable([data]);
      }
    } else {
      await fetchPetsAndRender();
    }
  } catch (error) {
    responseOutput.textContent = JSON.stringify(
      { error: true, message: error.message },
      null,
      2
    );
    responseOutput.classList.add('response-error');
    responseOutput.classList.remove('empty');
  }
}

methodSelect.addEventListener('change', buildRequestPreview);
[
  petIdInput,
  nombreInput,
  edadInput,
  imagenInput,
  descripcionInput,
  ciudadInput
].forEach((el) => el.addEventListener('input', buildRequestPreview));

requestForm.addEventListener('submit', sendRequest);
reloadButton.addEventListener('click', () => {
  methodSelect.value = 'GET';
  buildRequestPreview();
  fetchPetsAndRender();
});

buildRequestPreview();
fetchPetsAndRender();

