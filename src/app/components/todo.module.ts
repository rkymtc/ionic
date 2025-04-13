import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoComponent } from './todo.component';
import { TodoListComponent } from './todo-list.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TodoComponent,
    TodoListComponent
  ],
  exports: [
    TodoComponent,
    TodoListComponent
  ]
})
export class TodoModule { } 