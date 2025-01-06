import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import s from "./RegistrationForm.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API from "../../API.jsx";

const RegistrationForm = () => {
  const navigate = useNavigate();

  const initialValues = { name: "", email: "", password: "" };

  const validationSchema = Yup.object().shape({
    name: Yup.string().min(3, "Minimum 3 characters").required("Required"),
    email: Yup.string().email("Invalid email format").required("Required"),
    password: Yup.string().min(6, "Minimum 6 characters").required("Required"),
  });

  const handleSubmit = async (values, options) => {
    try {
      const response = await axios.post(`${API}/register`, values);
      localStorage.setItem("token", response.data.token);
      options.resetForm();
      navigate("/chats");
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  return (
    <div className={s.container}>
      <h2 className={s.title}>Sign Up</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        <Form className={s.form}>
          <div className={s.fieldWrapper}>
            <label htmlFor="name" className={s.label}>
              Name
            </label>
            <Field name="name" type="text" className={s.input} id="name" />
            <ErrorMessage
              name="name"
              component="div"
              className={s.errorMessage}
            />
          </div>

          <div className={s.fieldWrapper}>
            <label htmlFor="email" className={s.label}>
              Email
            </label>
            <Field name="email" type="email" className={s.input} id="email" />
            <ErrorMessage
              name="email"
              component="div"
              className={s.errorMessage}
            />
          </div>

          <div className={s.fieldWrapper}>
            <label htmlFor="password" className={s.label}>
              Password
            </label>
            <Field
              name="password"
              type="password"
              className={s.input}
              id="password"
            />
            <ErrorMessage
              name="password"
              component="div"
              className={s.errorMessage}
            />
          </div>

          <button type="submit" className={s.button}>
            Sign Up
          </button>
        </Form>
      </Formik>
    </div>
  );
};

export default RegistrationForm;
