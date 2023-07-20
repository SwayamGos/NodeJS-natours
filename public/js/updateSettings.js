/*eslint-disable*/

import { showAlert } from './alert';

const jsonFormData = async (formData) => {
  const plainFormData = Object.fromEntries(formData.entries());
  console.log(plainFormData);
  return JSON.stringify(plainFormData);
};

export const updateSettings = async (data, type) => {
  const dt = { ...data };
  let options = {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  try {
    let url = 'http://127.0.0.1:3000/api/v1/users/';

    if (type === 'password') {
      url += 'updatePassword';
      options.body = JSON.stringify(dt);
    } else {
      url += 'updateMe';
      let form = new FormData();
      form.append('name', dt.name);
      form.append('email', dt.email);
      form.append('photo', dt.photo[0]);
      console.log(dt.photo[0]);
      options.body = await jsonFormData(form);
      console.log(await options.body);
    }

    let res = await fetch(url, options);

    if (res.status === 200) {
      console.log('hi');
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    console.log('error', err);
  }
};
