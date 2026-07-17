import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, NonNullableFormBuilder } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ClienteCreateDTO, ApiResponseCliente, ClienteListDTO } from '../../../models/cliente.model';
import { ClientesService } from '../../../services/cliente-registro.service';
import { HttpErrorResponse } from '@angular/common/http';
import { procesarYComprimirImagen } from '../../../utils/image-processor';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
        selector: 'app-registro-cliente',
        standalone: true,
        imports: [CommonModule, ReactiveFormsModule],
        templateUrl: './registro-cliente.component.html',
        styleUrl: './registro-cliente.component.css'
})

/**
 * Componente para registrar nuevos clientes en la plataforma.
 * Envía los datos al servicio correspondiente y muestra mensajes de éxito o error.
 */
export class RegistroClienteComponent {

        private fb = inject<NonNullableFormBuilder>(FormBuilder as any);
        private clientesService = inject(ClientesService);
        private toastService = inject(ToastService);
        private cdr = inject(ChangeDetectorRef);

        cargando = signal(false);

        private imagenPerfilFile: File | undefined;

        clienteForm = this.fb.group({
                idCliente: [0],
                fldNombre: ['', Validators.required],
                fldNombreCorto: ['', Validators.required],
                fldTelefono: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
                fldCorreoElectronico: ['', [Validators.required, Validators.email]],
                fldFechaNacimiento: ['', Validators.required],
                fldContrasenia: ['', Validators.required],
                fldImagenPerfil: ['']
        });

        async enviarCliente(): Promise<void> {
                if (this.cargando() || this.clienteForm.invalid) {
                        if (this.clienteForm.invalid) {
                                this.clienteForm.markAllAsTouched();
                                this.toastService.showError('Completa todos los campos obligatorios correctamente.');
                        }
                        return;
                }

                this.cargando.set(true);

                const formValue = this.clienteForm.getRawValue();

                const cliente: ClienteCreateDTO = {
                        idCliente: 0,
                        idSuscripcion: 1,
                        fldNombre: formValue.fldNombre.trim(),
                        fldNombreCorto: formValue.fldNombreCorto.trim(),
                        fldTelefono: formValue.fldTelefono.trim(),
                        fldCorreoElectronico: formValue.fldCorreoElectronico.trim(),
                        fldFechaNacimiento: formValue.fldFechaNacimiento,
                        fldContrasenia: formValue.fldContrasenia.trim(),
                        fldImagenPerfil: ''
                };

                console.log('Enviando cliente:', cliente);

                try {
                        const response: ApiResponseCliente<ClienteListDTO> =
                                await firstValueFrom(this.clientesService.registroCliente(cliente, this.imagenPerfilFile));

                        if (response?.codigoEstatus === 1) {
                                this.toastService.showSuccess('Cliente creado correctamente.');
                                this.clienteForm.reset();
                                this.imagenPerfilFile = undefined;
                        } else {
                                throw new Error(response?.mensaje || 'Error en la respuesta del servidor');
                        }

                } catch (error) {
                        const errorMessage = (error as Error).message || (error as HttpErrorResponse)?.message || 'Error desconocido';
                        this.toastService.showError(`No se pudo crear el cliente: ${errorMessage}`);
                } finally {
                        this.cargando.set(false);
                }
        }

        onImagenPerfilChange(event: Event): void {
                const input = event.target as HTMLInputElement;
                const file = input.files?.[0];
                this.imagenPerfilFile = undefined;

                if (!file) {
                        this.toastService.showError('No se seleccionó ninguna imagen.');
                        return;
                }

                this.imagenPerfilFile = file;

                procesarYComprimirImagen(file, (msg, type) => {
                        if (type === 'success') {
                                this.toastService.showSuccess(msg);
                        } else {
                                this.toastService.showError(msg);
                        }
                }).then((base64) => {
                        if (base64) {
                                this.clienteForm.get('fldImagenPerfil')?.setValue(base64);
                                this.cdr.detectChanges();
                        }
                });
        }
}
