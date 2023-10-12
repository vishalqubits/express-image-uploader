import { FileInput, Label } from "flowbite-react";
import { Form, Formik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "flowbite-react";

const validationSchema = z.object({
  file: z.object({}).nullable(),
});

const formData = new FormData();

const Home = () => {
  const initialValues = {
    file: null,
  };

  const handleSubmit = async (values: { file: any }) => {
    formData.append("profile-file", values.file);

    console.log("File uploaded", values.file);

    try {
      const fileSubmission = await fetch(
        `http://localhost:3001/profile-upload-single`,
        {
          method: "POST",
          body: formData,
        }
      );
    } catch (error) {
      console.log("Integration error !!", error);
    }
  };

  return (
    <div className="p-6">
      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={toFormikValidationSchema(validationSchema)}
      >
        {(formik) => {
          return (
            <Form>
              <div className="max-w-md" id="fileUpload">
                <div className="mb-2 block">
                  <Label htmlFor="file" value="Upload file" />
                </div>
                <FileInput
                  helperText="Please upload an image"
                  id="file"
                  name="file"
                  onChange={(event) => {
                    formik.setFieldValue(
                      "file",
                      event.currentTarget.files?.[0]
                    );
                  }}
                />
                {formik.errors.file && formik.touched.file && (
                  <div style={{ color: "red" }}>{formik.errors.file}</div>
                )}
              </div>
              <Button type="submit">Submit</Button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default Home;
