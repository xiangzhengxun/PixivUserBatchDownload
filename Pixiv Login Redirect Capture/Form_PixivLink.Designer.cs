
namespace Pixiv_Login_Redirect_Capture
{
    partial class Form_PixivLink
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form_PixivLink));
            this.label_pixivlink = new System.Windows.Forms.Label();
            this.textBox_pixivlink = new System.Windows.Forms.TextBox();
            this.btn_CopyToClipboard = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // label_pixivlink
            // 
            resources.ApplyResources(this.label_pixivlink, "label_pixivlink");
            this.label_pixivlink.Name = "label_pixivlink";
            // 
            // textBox_pixivlink
            // 
            resources.ApplyResources(this.textBox_pixivlink, "textBox_pixivlink");
            this.textBox_pixivlink.Name = "textBox_pixivlink";
            // 
            // btn_CopyToClipboard
            // 
            resources.ApplyResources(this.btn_CopyToClipboard, "btn_CopyToClipboard");
            this.btn_CopyToClipboard.Name = "btn_CopyToClipboard";
            this.btn_CopyToClipboard.UseVisualStyleBackColor = true;
            this.btn_CopyToClipboard.Click += new System.EventHandler(this.btn_CopyToClipboard_Click);
            // 
            // Form_PixivLink
            // 
            resources.ApplyResources(this, "$this");
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.btn_CopyToClipboard);
            this.Controls.Add(this.label_pixivlink);
            this.Controls.Add(this.textBox_pixivlink);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.SizableToolWindow;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "Form_PixivLink";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label_pixivlink;
        private System.Windows.Forms.TextBox textBox_pixivlink;
        private System.Windows.Forms.Button btn_CopyToClipboard;
    }
}