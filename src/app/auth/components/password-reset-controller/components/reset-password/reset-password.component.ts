/*import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createResetPassword } from '../../model/reset-password.model';
import { validateCodeServices} from '../../services/validate-code.services';

@Component({
    selector: 'app-validate-code',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css']
})

export class ValidateCode {
    email:string = '';  
    code:string = '';
    mensaje:string|null = null;
    tipoMensaje: 'success' | 'error' = 'success';
    isLoading: boolean = false;

    constructor(
        private validateCodeServices: validateCodeServices,
        private cdr: ChangeDetectorRef
    ){}

    onValidatePassword(){
        if (!this.email){
            this.mostrarAlerta('Por favor, completa el correo electrónico.','error');
            return;
        }

        this.isLoading = true;
        this.mensaje = null;
        this.cdr.detectChanges();

        const payload : createValideCode = {
            email: this.email,
            code: this.code
        }

        this.validateCodeServices.crearForgotPassword(payload).subscribe({
            next:(respuesta:string) => {
                this.mostrarAlerta(respuesta,'success');
                this.isLoading = false;
            },
            error:(err) => {
                this.mostrarAlerta(err.mensaje, 'error');
                this.isLoading = false
            }
        });
    }

    private mostrarAlerta (mensaje:string, tipo:'success' | 'error'):void{
        this.mensaje = mensaje;
        this.tipoMensaje = tipo;
        setTimeout(()=>{
            this.mensaje = null;
            this.cdr.detectChanges();
        },3000)    
        this.cdr.detectChanges();
    }

}*/