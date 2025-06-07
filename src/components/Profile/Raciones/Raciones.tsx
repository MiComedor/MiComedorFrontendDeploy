import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  Stack,
  IconButton,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import { Formik, Form, Field, FieldProps, FormikHelpers } from "formik";
import * as Yup from "yup";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import TextField from "@mui/material/TextField";
import "./RacionesPage.css";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import RationByUserId from "../../../types/rationByUserId";
import RationService from "../../../services/ration.service";
import Autocomplete from "@mui/material/Autocomplete";
import BeneficiaryByUserId from "../../../types/BeneficiaryByUserId";
import beneficiaryService from "../../../services/beneficiary.service";
import RationType from "../../../types/TypeRation";
import Ration from "../../../types/ration.type";
import EditRationDialog from "./EditRationDialog";
import RationTypeService from "../../../services/rationType.service";
import DeleteRacionesDialog from "./DeleteRacionesDialog";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";

const initialRationValues: Ration = {
  date: "",
  price: 0,
  users: undefined,
  rationType: undefined,
  beneficiary: undefined,
};

const validationSchema = Yup.object({
  date: Yup.string().required("Campo obligatorio"),
  rationType: Yup.object()
    .shape({
      idRationType: Yup.number().required("Campo obligatorio"),
    })
    .required("Campo obligatorio"),
  beneficiary: Yup.object()
    .shape({
      idBeneficiary: Yup.number().required("Campo obligatorio"),
    })
    .required("Campo obligatorio"),
  price: Yup.number()
    .typeError("Debe ser un número")
    .positive("Debe ser un número positivo")
    .required("Campo obligatorio"),
});

const RegistroRaciones: React.FC = () => {
  const [raciones, setRaciones] = useState<RationByUserId[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<
    (BeneficiaryByUserId & { firstLetter: string })[]
  >([]);
  const [tipoRacion, setTipoRacion] = useState<RationType[]>([]);
  const [dialogOpenEdit, setDialogOpenEdit] = useState(false);
  const [dialogOpenDelete, setDialogOpenDelete] = useState(false);
  const [editing, setEditing] = useState<Ration | null>(null);
  const [deleting, setDeleting] = useState<Ration | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const navigate = useNavigate();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDelete = (racion: RationByUserId) => {
    const fullRation: Ration = {
      idRation: racion.idRation,
      date: racion.date,
      price: racion.price,
      rationType: tipoRacion.find(
        (r) => r.nameRationType === racion.nameRationType
      ),
      beneficiary: beneficiarios.find(
        (b) => b.dniBenefeciary === racion.dniBenefeciary
      ),
    };
    setDeleting(fullRation);
    setDialogOpenDelete(true);
  };

  const handleOpenEdit = (racion: RationByUserId) => {
    const fullRation: Ration = {
      idRation: racion.idRation,
      date: racion.date,
      price: racion.price,
      rationType: tipoRacion.find(
        (r) => r.nameRationType === racion.nameRationType
      ),
      beneficiary: beneficiarios.find(
        (b) => b.dniBenefeciary === racion.dniBenefeciary
      ),
    };
    setEditing(fullRation);
    setDialogOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setDialogOpenEdit(false);
    setEditing(null);
  };

  const handleCloseDelete = () => {
    setDialogOpenDelete(false);
    setDeleting(null);
  };

  const getRaciones = () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return;

    RationService.buscarRacionPorUserId(user.idUser).then((racionesList) => {
      const listaRaciones = racionesList
        .map((r) => ({
          idRation: r.idRation,
          date: r.date,
          nameRationType: r.nameRationType,
          dniBenefeciary: r.dniBenefeciary,
          price: r.price,
        }))
        .reverse();
      setRaciones(listaRaciones);
    });

    beneficiaryService.buscarBeneficiaryPorUserId(user.idUser).then((data) => {
      const beneficiariosConLetra = data.map((b) => ({
        ...b,
        firstLetter: b.fullnameBenefeciary.charAt(0).toUpperCase(),
      }));
      setBeneficiarios(beneficiariosConLetra);
    });

    RationTypeService.listarRacion().then((tipoRacion) => {
      const listaTipoRaciones = tipoRacion.map((r) => ({
        idRationType: r.idRationType,
        nameRationType: r.nameRationType,
      }));
      setTipoRacion(listaTipoRaciones);
    });
  };

  const saveRacion = async (
    values: typeof initialRationValues,
    actions: FormikHelpers<typeof initialRationValues>
  ) => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return;

    try {
      await RationService.insertarRacion({
        date: values.date,
        price: Number(values.price),
        users: {
          idUser: user.idUser,
        },
        rationType: {
          idRationType: values.rationType!.idRationType,
        },
        beneficiary: {
          idBeneficiary: values.beneficiary!.idBeneficiary,
        },
      });

      actions.resetForm();
      getRaciones();
    } catch (error) {
      console.error("❌ Error al guardar ración:", error);
    }
  };

  const editRaciones = async (values: typeof initialRationValues) => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || !values.rationType || !values.beneficiary) return;

    try {
      await RationService.actualizarRacion({
        idRation: values.idRation,
        date: values.date,
        price: Number(values.price),
        users: { idUser: user.idUser },
        rationType: { idRationType: values.rationType.idRationType },
        beneficiary: { idBeneficiary: values.beneficiary.idBeneficiary },
      });

      getRaciones();
      handleCloseEdit();
    } catch (error) {
      console.error("❌ Error al actualizar ración:", error);
    }
  };

  const deleteRaciones = async (values: Ration) => {
    try {
      if (!values.idRation) return;

      await RationService.eliminarRacion(values.idRation);

      getRaciones();
      handleCloseDelete();
    } catch (error) {
      console.error("❌ Error al eliminar ración:", error);
    }
  };

  useEffect(() => {
    getRaciones();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ padding: 4 }}>
        <Stack spacing={5}>
          {/* Formulario */}
          <div className="formulario-raciones">
            <Formik
              initialValues={initialRationValues}
              validationSchema={validationSchema}
              onSubmit={saveRacion}
            >
              {({ errors, touched }) => (
                <Form>
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={2}
                    justifyContent="center"
                    alignItems={isMobile ? "center" : "flex-end"}
                    sx={{ width: "100%" }}
                  >
                    <div className="form-group-raciones">
                      <label className="titulo-arriba-form">Fecha</label>
                      <Field name="date" className="form-input-fecha">
                        {({ field, form, meta }: FieldProps) => (
                          <MobileDatePicker
                            format="DD/MM/YYYY"
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(date) =>
                              form.setFieldValue(
                                "date",
                                date?.format("YYYY-MM-DD")
                              )
                            }
                            slotProps={{
                              textField: {
                                className: "form-input",
                                error: meta.touched && Boolean(meta.error),
                                helperText: meta.touched && meta.error,
                              },
                            }}
                          />
                        )}
                      </Field>
                    </div>

                    <div className="form-group-raciones">
                      <label className="titulo-arriba-form">
                        Tipo de ración
                      </label>
                      <Field name="rationType">
                        {({ form, field, meta }: FieldProps) => (
                          <Autocomplete
                            disablePortal
                            options={tipoRacion}
                            getOptionLabel={(option) => option.nameRationType}
                            isOptionEqualToValue={(option, value) =>
                              option.idRationType === value?.idRationType
                            }
                            value={field.value || null}
                            onChange={(_, newValue) => {
                              form.setFieldValue("rationType", newValue);
                            }}
                            onClose={() => {
                              if (
                                document.activeElement instanceof HTMLElement
                              ) {
                                document.activeElement.blur();
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                className="form-input"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={
                                  meta.touched &&
                                  typeof meta.error === "object" &&
                                  meta.error
                                    ? (meta.error as { idRationType?: string })
                                        .idRationType
                                    : undefined
                                }
                              />
                            )}
                          />
                        )}
                      </Field>
                    </div>

                    <div className="form-group-raciones">
                      <label className="titulo-arriba-form">DNI</label>
                      <Field name="beneficiary" className="form-input">
                        {({ form, field, meta }: FieldProps) => (
                          <Autocomplete
                            options={beneficiarios.sort((a, b) =>
                              a.firstLetter.localeCompare(b.firstLetter)
                            )}
                            groupBy={(option) => option.firstLetter}
                            getOptionLabel={(option) =>
                              `${option.fullnameBenefeciary} / ${option.dniBenefeciary}`
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.idBeneficiary === value?.idBeneficiary
                            }
                            value={field.value || null}
                            onChange={(_, newValue) => {
                              form.setFieldValue("beneficiary", newValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                className="form-input"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={
                                  meta.touched &&
                                  typeof meta.error === "object" &&
                                  meta.error
                                    ? (meta.error as { idBeneficiary?: string })
                                        .idBeneficiary
                                    : undefined
                                }
                              />
                            )}
                            renderGroup={(params) => (
                              <li key={params.key}>
                                <div className="color-select-categoria">
                                  {params.group}
                                </div>
                                <ul style={{ padding: 0 }}>
                                  {params.children}
                                </ul>
                              </li>
                            )}
                          />
                        )}
                      </Field>
                    </div>

                    <div className="form-group-raciones">
                      <label className="titulo-arriba-form">
                        Precio por ración
                      </label>
                      <Field name="price" className="boton-verde">
                        {({ field }: FieldProps) => (
                          <TextField
                            {...field}
                            className="form-input"
                            error={touched.price && Boolean(errors.price)}
                            helperText={touched.price && errors.price}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  S/
                                </InputAdornment>
                              ),
                              inputProps: {
                                onKeyDown: (
                                  e: React.KeyboardEvent<HTMLInputElement>
                                ) => {
                                  const allowedKeys = [
                                    "Backspace",
                                    "Tab",
                                    "ArrowLeft",
                                    "ArrowRight",
                                    "Delete",
                                  ];
                                  const isNumber = /^[0-9.]$/.test(e.key);

                                  if (
                                    !isNumber &&
                                    !allowedKeys.includes(e.key)
                                  ) {
                                    e.preventDefault();
                                  }

                                  if (
                                    e.key === "." &&
                                    field.value.includes(".")
                                  ) {
                                    e.preventDefault();
                                  }
                                },
                              },
                            }}
                          />
                        )}
                      </Field>
                    </div>

                    <IconButton
                      type="submit"
                      className="boton-verde"
                      sx={{
                        width: isMobile ? 255 : 60,
                        height: isMobile ? 60 : 60,
                        alignSelf: isMobile ? "center" : "flex-end",
                        mt: isMobile ? 1 : 0,
                        borderRadius: 2,
                      }}
                    >
                      <AddIcon sx={{ fontSize: 42 }} />
                    </IconButton>
                  </Stack>
                </Form>
              )}
            </Formik>
          </div>

          {/* Tabla */}
          {isMobile ? (
            <>
              <Stack spacing={2}>
                {raciones
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((racion) => (
                    <Paper
                      key={racion.idRation}
                      elevation={3}
                      sx={{ padding: 2, borderRadius: 2 }}
                    >
                      <div>
                        <strong>Fecha:</strong>{" "}
                        {dayjs(racion.date).format("DD/MM/YYYY")}
                      </div>
                      <div>
                        <strong>Tipo:</strong> {racion.nameRationType}
                      </div>
                      <div>
                        <strong>Beneficiario:</strong> {racion.dniBenefeciary} /{" "}
                        {beneficiarios.find(
                          (b) => b.dniBenefeciary === racion.dniBenefeciary
                        )?.fullnameBenefeciary || "Desconocido"}
                      </div>
                      <div>
                        <strong>Precio:</strong> S/ {racion.price.toFixed(2)}
                      </div>
                      <Box
                        mt={2}
                        display="flex"
                        justifyContent="center"
                        gap={2}
                      >
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEdit(racion)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleOpenDelete(racion)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </Paper>
                  ))}
              </Stack>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={raciones.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página"
                labelDisplayedRows={({ from, to, count }) =>
                  `Del ${from} al ${to} de ${
                    count !== -1 ? count : `más de ${to}`
                  } movimientos`
                }
                sx={{
                  "& .MuiTablePagination-toolbar": {
                    flexDirection: "column",
                    alignItems: "flex-start",
                    px: 1,
                    gap: 1,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                    {
                      fontSize: "0.85rem",
                    },
                  "& .MuiTablePagination-actions": {
                    alignSelf: "flex-end",
                  },
                }}
              />
            </>
          ) : (
            <Box className="table-container-raciones">
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <em>Fecha</em>
                      </TableCell>
                      <TableCell>
                        <em>Tipo de ración</em>
                      </TableCell>
                      <TableCell>
                        <em>DNI / Nombre de beneficiario</em>
                      </TableCell>
                      <TableCell>
                        <em>Precio por ración</em>
                      </TableCell>
                      <TableCell>
                        <em>Acciones</em>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {raciones
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((racion) => (
                        <TableRow key={racion.idRation}>
                          <TableCell>
                            {dayjs(racion.date).format("DD/MM/YYYY")}
                          </TableCell>
                          <TableCell>{racion.nameRationType}</TableCell>
                          <TableCell>
                            {racion.dniBenefeciary} /{" "}
                            {beneficiarios.find(
                              (b) => b.dniBenefeciary === racion.dniBenefeciary
                            )?.fullnameBenefeciary || "Desconocido"}
                          </TableCell>
                          <TableCell>S/ {racion.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <IconButton color="primary">
                              <EditIcon
                                onClick={() => handleOpenEdit(racion)}
                              />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDelete(racion)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={raciones.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Filas por página"
                  labelDisplayedRows={({ from, to, count }) =>
                    `Del ${from} al ${to} de ${
                      count !== -1 ? count : `más de ${to}`
                    } movimientos`
                  }
                  sx={{
                    "& .MuiTablePagination-toolbar": {
                      flexDirection: { xs: "row", sm: "row" },
                      flexWrap: { xs: "wrap", sm: "nowrap" },
                      justifyContent: { xs: "space-between", sm: "flex-end" },
                      alignItems: "center",
                      gap: 1,
                      px: 1,
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                      {
                        fontSize: "0.85rem",
                        marginBottom: { xs: 0.5, sm: 0 },
                      },
                    "& .MuiTablePagination-actions": {
                      marginLeft: { xs: 0, sm: 2 },
                    },
                  }}
                />
              </TableContainer>
            </Box>
          )}
          {/* Botón de regresar */}
          <Box>
            <Button
              variant="contained"
              color="warning"
              startIcon={<ArrowBackIcon />}
              sx={{ fontWeight: "bold" }}
              onClick={() => navigate("/profile")}
            >
              REGRESAR AL MENÚ
            </Button>
          </Box>
          {editing && (
            <EditRationDialog
              open={dialogOpenEdit}
              onClose={handleCloseEdit}
              data={editing}
              onSubmit={editRaciones}
              rationTypes={tipoRacion}
              beneficiaries={beneficiarios}
            />
          )}
          {deleting && (
            <DeleteRacionesDialog
              open={dialogOpenDelete}
              onClose={handleCloseDelete}
              data={deleting}
              onSubmit={deleteRaciones}
              rationTypes={tipoRacion}
              beneficiaries={beneficiarios}
            />
          )}
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default RegistroRaciones;
