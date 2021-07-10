
namespace Pixiv_Login_Redirect_Capture
{
    partial class Form_Register
    {
        /// <summary>
        /// 必需的设计器变量。
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// 清理所有正在使用的资源。
        /// </summary>
        /// <param name="disposing">如果应释放托管资源，为 true；否则为 false。</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows 窗体设计器生成的代码

        /// <summary>
        /// 设计器支持所需的方法 - 不要修改
        /// 使用代码编辑器修改此方法的内容。
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form_Register));
            this.group_protocol = new System.Windows.Forms.GroupBox();
            this.button_unregister = new System.Windows.Forms.Button();
            this.button_register = new System.Windows.Forms.Button();
            this.group_protocol.SuspendLayout();
            this.SuspendLayout();
            // 
            // group_protocol
            // 
            resources.ApplyResources(this.group_protocol, "group_protocol");
            this.group_protocol.Controls.Add(this.button_unregister);
            this.group_protocol.Controls.Add(this.button_register);
            this.group_protocol.Name = "group_protocol";
            this.group_protocol.TabStop = false;
            // 
            // button_unregister
            // 
            resources.ApplyResources(this.button_unregister, "button_unregister");
            this.button_unregister.Name = "button_unregister";
            this.button_unregister.UseVisualStyleBackColor = true;
            this.button_unregister.Click += new System.EventHandler(this.button_unregister_Click);
            // 
            // button_register
            // 
            resources.ApplyResources(this.button_register, "button_register");
            this.button_register.Name = "button_register";
            this.button_register.UseVisualStyleBackColor = true;
            this.button_register.Click += new System.EventHandler(this.button_register_Click);
            // 
            // Form_Register
            // 
            resources.ApplyResources(this, "$this");
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.group_protocol);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "Form_Register";
            this.Load += new System.EventHandler(this.Register_Load);
            this.group_protocol.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox group_protocol;
        private System.Windows.Forms.Button button_unregister;
        private System.Windows.Forms.Button button_register;
    }
}

